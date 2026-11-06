// The API type and model of the product's own steps, the screening and the description, at the first start, as
// FastAPI's model list names them; the pipeline steps table holds them afterwards (PipelineService)
export const PipelineApiType = 'OpenAI';
export const PipelineModel = 'gpt-6.1-sol';

// The API type and model of each voice's caption step at the first start (FlavorsService)
export const CaptionApiType = 'OpenAI';
export const CaptionModel = 'gpt-6.1-sol';

export const CaptionsPerPhoto = 3;
export const MaxCaptionLength = 160;

// Photos one user may submit per campus date
export const MaxDailyRoasts = 3;
// LLM requests an upload makes: the photo's screening and its description
export const UploadLlmCalls = 2;
// LLM requests one user may cause per campus date: a roast is the upload's requests and one request per step of each
// voice's chain, 8 with the seeded chains (4 voices of one step and one of 2), and a generation that failed is run
// again
export const MaxDailyUserLlmCalls = 48;
// LLM requests the whole site may make per campus date
export const MaxDailyLlmCalls = 600;
