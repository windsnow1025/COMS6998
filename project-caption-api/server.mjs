// A stand-in for the caption API (nonchalant) that the Semester Project's admin console calls for caption generation
// and the review of similar captions. It keeps its jobs in the project's own Supabase database through the functions
// the hosted API uses (submit, claim, checkpoint, fail, get), with the project's secret key, writes captions and
// names groups through this cluster's FastAPI /chat, and groups similar captions by their embeddings. Only a signed-in superadmin of the project is served.

import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const PORT = Number(process.env.PORT ?? 3101);
const SUPABASE_URL = required("SUPABASE_URL").replace(/\/+$/, "");
const SUPABASE_SECRET_KEY = required("SUPABASE_SECRET_KEY");
const FASTAPI_URL = required("FASTAPI_URL").replace(/\/+$/, "");
const JWT_SECRET = required("JWT_SECRET");
const API_TYPE = process.env.API_TYPE ?? "OpenAI";
const MODEL = process.env.MODEL ?? "gpt-6.1-sol";
const OPENAI_API_KEY = required("OPENAI_API_KEY");
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
// The cosine similarity from which 2 captions count as similar
const COSINE_THRESHOLD = Number(process.env.COSINE_THRESHOLD ?? 0.7);
// The image and flavor tasks accepted in one UTC day, which bounds what the demo spends on the model
const DAILY_TASK_LIMIT = Number(process.env.DAILY_TASK_LIMIT ?? 300);
// The hosted worker completes tasks in waves of 5
const TASK_CONCURRENCY = 5;
const MAX_CAPTIONS_PER_TASK = 10;
const SWEEP_MS = 30_000;

function log(...parts) {
  console.log(new Date().toISOString().slice(11, 19), ...parts);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Supabase, with the project's secret key
// ---------------------------------------------------------------------------
async function supabase(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${init.method ?? "GET"} ${path.split("?")[0]} answered ${response.status}: ${text.slice(0, 300)}`);
  }
  return { body: text ? JSON.parse(text) : null, headers: response.headers };
}

const rows = async (path) => (await supabase(`/rest/v1/${path}`)).body;
const rpc = async (name, args) => (await supabase(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) })).body;

// The signed-in superadmin behind a token, checked with Supabase and remembered for a minute
const viewers = new Map(); // token -> { userId, until }
async function viewerOf(token) {
  const known = viewers.get(token);
  if (known && known.until > Date.now()) return known.userId;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new HttpError(401, "A signed-in user's token is required.");
  const user = await response.json();
  const profile = await rows(`profiles?id=eq.${encodeURIComponent(user.id)}&select=is_superadmin`);
  if (!profile[0]?.is_superadmin) throw new HttpError(403, "Superadmin privileges required.");
  if (viewers.size > 1000) viewers.clear();
  viewers.set(token, { userId: user.id, until: Date.now() + 60_000 });
  return user.id;
}

const IMAGE_SELECT = "id,url,image_description,additional_context,celebrity_recognition";

async function loadImageIds(request) {
  if (request.imageId) {
    const found = await rows(`images?id=eq.${encodeURIComponent(request.imageId)}&select=id`);
    return found.map((image) => image.id);
  }
  const members = await rows(
    `study_image_set_image_mappings?study_image_set_id=eq.${Number(request.studyImageSetId)}&select=image_id&order=id.asc`
  );
  return [...new Set(members.map((member) => member.image_id))];
}

async function loadFlavors(slug) {
  if (slug) {
    const found = await rows(`humor_flavors?slug=eq.${encodeURIComponent(slug)}&select=id,slug`);
    if (!found.length) throw new HttpError(400, `No humor flavor has the slug ${slug}`);
    return [{ ...found[0], captionCount: null }];
  }
  // No flavor: the current humor mix, one task per image per mix flavor
  const mix = await rows("humor_flavor_mix?select=caption_count,humor_flavors(id,slug)");
  const flavors = mix.filter((row) => row.humor_flavors).map((row) => ({ ...row.humor_flavors, captionCount: row.caption_count ?? null }));
  if (!flavors.length) throw new HttpError(400, "The humor mix is empty");
  return flavors;
}

async function loadSteps(flavor) {
  const steps = await rows(
    `humor_flavor_steps?humor_flavor_id=eq.${flavor.id}&is_hidden=eq.false&order=order_by.asc&select=id,order_by,llm_input_type_id,llm_output_type_id,llm_temperature,llm_system_prompt,llm_user_prompt`
  );
  if (!steps.length) throw new HttpError(400, `The flavor ${flavor.slug} has no visible steps`);
  return steps;
}

// ---------------------------------------------------------------------------
// FastAPI /chat, as Nest's LlmClient calls it
// ---------------------------------------------------------------------------
const base64url = (input) => Buffer.from(input).toString("base64url");

// A token for FastAPI, signed as the deployment signs them (HS256, sub = account 1), renewed before it ends
let fastApiToken = { value: "", until: 0 };
function fastApiAuthorization() {
  const now = Math.floor(Date.now() / 1000);
  if (fastApiToken.until < now + 600) {
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64url(JSON.stringify({ sub: "1", iat: now, exp: now + 12 * 3600 }));
    const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    fastApiToken = { value: `${header}.${payload}.${signature}`, until: now + 12 * 3600 };
  }
  return `Bearer ${fastApiToken.value}`;
}

const ARRAY_SCHEMA = {
  type: "object",
  properties: { captions: { type: "array", items: { type: "string" } } },
  required: ["captions"],
  additionalProperties: false,
};

async function chat({ system, user, imageUrl, temperature, schema }) {
  const contents = [];
  if (imageUrl) contents.push({ type: "file", data: imageUrl });
  contents.push({ type: "text", data: user });
  const body = JSON.stringify({
    messages: [
      { role: "system", contents: [{ type: "text", data: system || "" }] },
      { role: "user", contents },
    ],
    api_type: API_TYPE,
    model: MODEL,
    temperature: temperature ?? 1,
    stream: false,
    thought: false,
    web_search: false,
    code_execution: false,
    structured_output_schema: schema ?? null,
  });
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${FASTAPI_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: fastApiAuthorization() },
      body,
      signal: AbortSignal.timeout(120_000),
    });
    if (response.status === 503 && attempt < 5) {
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    if (!response.ok) throw new Error(`FastAPI answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const answer = await response.json();
    return answer.text ?? "";
  }
}

// The placeholders of the staff's prompts that the image row can fill; the rest stay as written
function fillPlaceholders(text, image) {
  return (text ?? "")
    .replaceAll("{imageDescription}", image.image_description ?? "")
    .replaceAll("{imageAdditionalContext}", image.additional_context ?? "")
    .replaceAll("{celebrityRecognition}", image.celebrity_recognition ?? "");
}

function parseCaptions(text) {
  const trimmed = text.trim();
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // A plain-text answer: one caption per non-empty line
    return trimmed.split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-*\d]+[.)]?)\s*/, "").trim()).filter(Boolean);
  }
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.captions) ? parsed.captions : [];
  return list.map((item) => (typeof item === "string" ? item : item?.caption ?? item?.text ?? "")).map((s) => String(s).trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// The worker: each task runs its flavor's steps one claim at a time, as the hosted worker does
// ---------------------------------------------------------------------------
const taken = new Set();
const waiting = [];
let working = 0;

function take(taskIds) {
  for (const id of taskIds) {
    if (taken.has(id)) continue;
    taken.add(id);
    waiting.push(id);
  }
  while (working < TASK_CONCURRENCY && waiting.length) {
    const id = waiting.shift();
    working += 1;
    runTask(id)
      .catch((error) => log(`task ${id.slice(0, 8)} stopped: ${error instanceof Error ? error.message : error}`))
      .finally(() => {
        working -= 1;
        taken.delete(id);
        take([]);
      });
  }
}

async function runTask(taskId) {
  for (;;) {
    const claim = await rpc("claim_caption_generation_task", { p_task_id: taskId });
    if (!claim) return;
    const { task } = claim;
    try {
      const index = task.outputs.length;
      const step = task.steps[index];
      const final = index === task.steps.length - 1;
      const [image] = await rows(`images?id=eq.${task.image_id}&select=${IMAGE_SELECT}`);
      if (!image) throw new Error("The image is gone");
      const system = fillPlaceholders(step.llm_system_prompt, image);
      let user = fillPlaceholders(step.llm_user_prompt, image);
      if (index > 0) user = `${user}\n\nOutput of the previous step:\n${task.outputs[index - 1]}`;
      if (final && task.caption_count) user = `${user}\n\nWrite exactly ${task.caption_count} caption(s).`;
      const text = await chat({
        system,
        user,
        imageUrl: step.llm_input_type_id === 1 ? image.url : undefined,
        temperature: step.llm_temperature == null ? 1 : Number(step.llm_temperature),
        schema: step.llm_output_type_id === 2 ? ARRAY_SCHEMA : null,
      });
      // The hosted worker stores what the chain returns, or exactly the mix's count when one is set
      const captions = final ? parseCaptions(text).slice(0, task.caption_count ?? MAX_CAPTIONS_PER_TASK) : null;
      if (final && !captions.length) throw new Error("The last step returned no caption");
      const kept = await rpc("checkpoint_caption_generation_task", {
        p_task_id: taskId,
        p_lease_token: task.lease_token,
        p_output: text,
        p_captions: captions,
      });
      if (final) log(`task ${taskId.slice(0, 8)} image ${task.image_id.slice(0, 8)}: ${captions.length} captions`);
      if (!kept || final) return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`task ${taskId.slice(0, 8)} failed: ${message}`);
      await rpc("fail_caption_generation_task", {
        p_task_id: taskId,
        p_lease_token: task.lease_token,
        p_error: message,
        p_retryable: false,
      });
      return;
    }
  }
}

// Takes up the unfinished tasks of a job, or of every job of the last day, which covers a restart during a job and
// leaves the older tasks that came with the database alone
async function sweep(jobId = null) {
  const scope = jobId ? `job_id=eq.${jobId}` : `created_at=gte.${new Date(Date.now() - 24 * 3600 * 1000).toISOString()}`;
  const pending = await rows(`caption_generation_tasks?${scope}&status=in.(queued,running)&select=id&order=created_at.asc,id.asc`);
  take(pending.map((task) => task.id));
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
async function tasksAcceptedToday() {
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;
  const { headers } = await supabase(`/rest/v1/caption_generation_tasks?created_at=gte.${dayStart}&select=id`, {
    headers: { Prefer: "count=exact", Range: "0-0" },
  });
  return Number((headers.get("content-range") ?? "*/0").split("/")[1]) || 0;
}

async function submitJob(userId, idempotencyKey, request) {
  const imageIds = await loadImageIds(request);
  if (!imageIds.length) throw new HttpError(400, "The image set has no images");
  const flavors = await loadFlavors(request.humorFlavorSlug);
  const tasks = [];
  for (const flavor of flavors) {
    const steps = await loadSteps(flavor);
    for (const imageId of imageIds) tasks.push({ imageId, humorFlavorId: flavor.id, captionCount: flavor.captionCount, steps });
  }
  if (tasks.length > 100) throw new HttpError(400, "A job takes at most 100 image and flavor tasks.");
  const today = await tasksAcceptedToday();
  if (today + tasks.length > DAILY_TASK_LIMIT) {
    throw new HttpError(429, `The demo generates captions for ${DAILY_TASK_LIMIT} images a day, and ${today} are used. Try again tomorrow (UTC).`);
  }
  const jobId = await rpc("submit_caption_generation_job", {
    p_user_id: userId,
    p_client_id: null,
    p_idempotency_key: idempotencyKey,
    p_request: request,
    p_tasks: tasks,
  });
  log(`job ${jobId.slice(0, 8)} accepted: study ${request.studyId}, ${imageIds.length} images x ${flavors.length} flavor(s) (${flavors.map((flavor) => flavor.slug).join(", ")})`);
  void sweep(jobId).catch((error) => log(`sweep failed: ${error instanceof Error ? error.message : error}`));
  return jobId;
}

async function jobStatus(jobId, userId) {
  const job = await rpc("get_caption_generation_job", { p_job_id: jobId, p_user_id: userId, p_client_id: null });
  if (!job) return null;
  const tasks = (job.tasks ?? []).map((task) => ({
    imageId: task.imageId,
    status: task.status,
    completedSteps: task.completedSteps,
    totalSteps: task.totalSteps,
    captionIds: task.captionIds ?? [],
    error: task.error ?? null,
    attempts: task.attempts,
  }));
  const completed = tasks.filter((task) => task.status === "completed").length;
  const failed = tasks.filter((task) => task.status === "failed").length;
  const begun = tasks.some((task) => task.status !== "queued" || task.completedSteps > 0 || task.attempts > 0);
  const status = completed + failed === tasks.length
    ? failed === 0 ? "completed" : completed === 0 ? "failed" : "partially_completed"
    : begun ? "running" : "queued";
  return {
    jobId: job.jobId,
    status,
    imageIds: [...new Set(tasks.map((task) => task.imageId))],
    captionIds: tasks.flatMap((task) => task.captionIds),
    progress: {
      total: tasks.length,
      completed,
      failed,
      completedSteps: tasks.reduce((sum, task) => sum + task.completedSteps, 0),
      totalSteps: tasks.reduce((sum, task) => sum + task.totalSteps, 0),
    },
    tasks: tasks.map(({ attempts, ...task }) => task),
  };
}

// ---------------------------------------------------------------------------
// Similar captions: each caption's embedding, and the groups that cosine similarity joins
// ---------------------------------------------------------------------------
const EMBEDDING_BATCH = 500;

// The embeddings of the texts, each of unit length, so that a dot product is the cosine similarity
async function embed(texts) {
  const vectors = [];
  for (let start = 0; start < texts.length; start += EMBEDDING_BATCH) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts.slice(start, start + EMBEDDING_BATCH) }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`The embedding request answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const answer = await response.json();
    for (const item of answer.data.sort((a, b) => a.index - b.index)) {
      const length = Math.hypot(...item.embedding);
      vectors.push(item.embedding.map((value) => value / length));
    }
  }
  return vectors;
}

// The groups of 2 or more entries that a chain of similar pairs joins, and the entries in no group
function groupBySimilarity(entries, vectors, threshold) {
  const parent = entries.map((_, index) => index);
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  // The pairs at each tenth of similarity, for the log, by which the threshold is set
  const pairsFrom = { 0.5: 0, 0.6: 0, 0.7: 0, 0.8: 0, 0.9: 0 };
  for (let a = 0; a < entries.length; a++) {
    for (let b = a + 1; b < entries.length; b++) {
      let similarity = 0;
      for (let d = 0; d < vectors[a].length; d++) similarity += vectors[a][d] * vectors[b][d];
      for (const level of Object.keys(pairsFrom)) if (similarity >= Number(level)) pairsFrom[level] += 1;
      if (similarity >= threshold) parent[find(a)] = find(b);
    }
  }
  const members = new Map();
  entries.forEach((entry, index) => {
    const root = find(index);
    if (!members.has(root)) members.set(root, []);
    members.get(root).push(entry);
  });
  const groups = [...members.values()].filter((group) => group.length >= 2);
  const other = [...members.values()].filter((group) => group.length < 2).flat();
  return { groups, other, pairsFrom };
}

// The last grouping of each study, answered again while the study's captions are the same
const groupings = new Map(); // studyId -> { signature, result }

async function dedupe(studyId) {
  const mappings = await rows(
    `study_caption_mappings?study_id=eq.${studyId}&select=id,caption_id,captions(id,content,image_id,like_count,images(url,image_description))&order=id.asc`
  );
  const entries = mappings.filter((mapping) => mapping.captions?.content?.trim()).map((mapping) => ({
    mappingId: mapping.id,
    captionId: mapping.captions.id,
    caption: mapping.captions.content,
    imageId: mapping.captions.image_id ?? null,
    imageUrl: mapping.captions.images?.url ?? null,
    imageDescription: mapping.captions.images?.image_description ?? null,
    likeCount: mapping.captions.like_count ?? null,
  }));
  const signature = `${COSINE_THRESHOLD}:${entries.map((entry) => entry.mappingId).join(",")}`;
  const known = groupings.get(studyId);
  if (known?.signature === signature) return known.result;

  const vectors = await embed(entries.map((entry) => entry.caption));
  const { groups, other, pairsFrom } = groupBySimilarity(entries, vectors, COSINE_THRESHOLD);
  const run = randomUUID().slice(0, 8);
  const buckets = groups.map((captions, index) => ({
    id: `cosine-${run}-${index + 1}`,
    label: `Group ${index + 1}`,
    mappingIds: captions.map((caption) => caption.mappingId),
    captions,
  }));
  log(`grouped study ${studyId}: ${entries.length} captions, ${buckets.length} groups at ${COSINE_THRESHOLD}; pairs from ${JSON.stringify(pairsFrom)}`);
  const result = {
    studyId,
    embeddingModel: EMBEDDING_MODEL,
    embeddingDimensions: vectors[0]?.length ?? 0,
    generatedAt: new Date().toISOString(),
    cosine: { method: "cosine", buckets, other, metadata: { threshold: COSINE_THRESHOLD } },
    hdbscan: { method: "hdbscan", buckets: [], other: [], metadata: {} },
  };
  if (groupings.size > 200) groupings.clear();
  groupings.set(studyId, { signature, result });
  return result;
}

const NAMES_SCHEMA = {
  type: "object",
  properties: { names: { type: "array", items: { type: "string" } } },
  required: ["names"],
  additionalProperties: false,
};
// The names given, answered again for the same group
const groupNames = new Map(); // bucket id -> name

// A name for each group asked about, written by the model from the group's captions
async function nameGroups(buckets) {
  const names = {};
  const unnamed = [];
  for (const bucket of buckets) {
    if (typeof bucket?.id !== "string") continue;
    if (groupNames.has(bucket.id)) names[bucket.id] = groupNames.get(bucket.id);
    else if (Array.isArray(bucket.captions) && bucket.captions.length) unnamed.push(bucket);
  }
  if (unnamed.length) {
    const list = unnamed.map((bucket, index) =>
      `Group ${index + 1}:\n${bucket.captions.slice(0, 12).map((caption) => `- ${String(caption?.caption ?? "").replace(/\s+/g, " ")}`).join("\n")}`
    ).join("\n\n");
    const text = await chat({
      system: "You prepare a humor study in which raters vote on captions. Similar captions were put into groups, and you name the groups.",
      user: `${list}\n\nName each group in 2 to 5 words for what its captions share. Answer with one name per group, in the groups' order.`,
      schema: NAMES_SCHEMA,
    });
    const answered = JSON.parse(text).names ?? [];
    if (groupNames.size > 5000) groupNames.clear();
    unnamed.forEach((bucket, index) => {
      const name = String(answered[index] ?? "").trim();
      if (!name) return;
      names[bucket.id] = name;
      groupNames.set(bucket.id, name);
    });
  }
  return names;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new HttpError(400, "The request body is not JSON."));
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/pipeline/health") return send(res, 200, { status: "ok" });

    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw new HttpError(401, "A signed-in user's token is required.");
    const userId = await viewerOf(token);

    if (req.method === "POST" && url.pathname === "/pipeline/generate-captions") {
      const request = await readBody(req);
      if (!Number.isInteger(request.studyId) || (!request.studyImageSetId && !request.imageId)) {
        throw new HttpError(400, "studyId and studyImageSetId or imageId are required.");
      }
      const idempotencyKey = req.headers["idempotency-key"];
      const jobId = await submitJob(userId, typeof idempotencyKey === "string" && idempotencyKey ? idempotencyKey : randomUUID(), request);
      return send(res, 202, { jobId });
    }

    const jobMatch = url.pathname.match(/^\/pipeline\/caption-job\/([0-9a-fA-F-]{36})$/);
    if (req.method === "GET" && jobMatch) {
      const job = await jobStatus(jobMatch[1], userId);
      if (!job) throw new HttpError(404, "No such caption job.");
      return send(res, 200, job);
    }

    if (req.method === "POST" && url.pathname === "/pipeline/deduplicate-study-captions") {
      const { studyId } = await readBody(req);
      if (!Number.isInteger(studyId)) throw new HttpError(400, "studyId is required.");
      return send(res, 200, await dedupe(studyId));
    }

    if (req.method === "POST" && url.pathname === "/pipeline/name-dedupe-buckets") {
      const { buckets } = await readBody(req);
      if (!Array.isArray(buckets)) throw new HttpError(400, "buckets is required.");
      return send(res, 200, { names: await nameGroups(buckets) });
    }

    throw new HttpError(404, `The caption API stand-in has no route ${req.method} ${url.pathname}.`);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : String(error);
    if (status >= 500) log(`${req.method} ${url.pathname} failed: ${message}`);
    return send(res, status, { message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  log(`caption API stand-in on ${PORT}, FastAPI at ${FASTAPI_URL}, model ${MODEL}, ${DAILY_TASK_LIMIT} tasks a day`);
  const sweepAll = () => void sweep().catch((error) => log(`sweep failed: ${error instanceof Error ? error.message : error}`));
  sweepAll();
  setInterval(sweepAll, SWEEP_MS);
});
