-- Seed data for the caption rating app. Run after TypeORM has created the tables.
INSERT INTO "image" ("url", "description", "version") VALUES
  ('https://picsum.photos/id/237/600/400', 'A black puppy sitting on a wooden floor, looking up at the camera.', 1),
  ('https://picsum.photos/id/1025/600/400', 'A pug wrapped in a plaid blanket, sitting on a forest path.', 1),
  ('https://picsum.photos/id/1074/600/400', 'A close-up of a lioness staring straight into the camera.', 1),
  ('https://picsum.photos/id/1084/600/400', 'Walruses lying on a sandy beach.', 1),
  ('https://picsum.photos/id/200/600/400', 'A shaggy highland cow standing on a beach under an overcast sky.', 1),
  ('https://picsum.photos/id/433/600/400', 'A close-up of a brown bear looking slightly upward.', 1);

INSERT INTO "caption" ("content", "imageId", "version") VALUES
  ('me checking the Vergil waitlist for the fourth month in a row', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/237/600/400'), 1),
  ('when the professor says "this will be on the final" in week 2', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/237/600/400'), 1),
  ('Butler quiet floor at 3 a.m. during finals week', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/1025/600/400'), 1),
  ('my motivation after the regrade request gets denied', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/1025/600/400'), 1),
  ('the one person who actually did the reading for discussion section', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/1074/600/400'), 1),
  ('walking into the 116th Street station after my last final', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/1074/600/400'), 1),
  ('me after the John Jay all-you-can-eat brunch', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/1084/600/400'), 1),
  ('senior year: gala tickets are $90 and I have $0.37 in dining dollars', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/1084/600/400'), 1),
  ('me pretending to follow the lecture while thinking about Koronet pizza', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/200/600/400'), 1),
  ('the Mudd wifi trying to load one CourseWorks page', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/200/600/400'), 1),
  ('my group project partner appearing the night before the deadline', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/433/600/400'), 1),
  ('me guarding my Butler study room after the fire alarm', (SELECT "id" FROM "image" WHERE "url" = 'https://picsum.photos/id/433/600/400'), 1);
