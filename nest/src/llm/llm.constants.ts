// The API type and model of the screening at the first start, as FastAPI's model list names them; the pipeline steps
// table holds them afterwards, with the temperature below as the first value (PipelineService)
export const DescribeApiType = 'OpenAI';
export const DescribeModel = 'gpt-6.1-sol';

// The API type and model of each voice's caption step at the first start (FlavorsService)
export const CaptionApiType = 'OpenAI';
export const CaptionModel = 'gpt-6.1-sol';

// FastAPI's library sends OpenAI's models after gpt-4 a temperature of 1 whatever the request says,
// and Google recommends 1 for all Gemini 3 models: https://ai.google.dev/gemini-api/docs/gemini-3
export const Temperature = 1;

export const CaptionsPerPhoto = 3;
export const MaxCaptionLength = 160;

// Photos one user may submit per campus date
export const MaxDailyRoasts = 3;
// LLM requests one user may cause per campus date: a roast is the screening and one request per step of each
// voice's chain, 7 with the seeded chains (4 voices of one step and one of 2), and a generation that failed is run
// again
export const MaxDailyUserLlmCalls = 48;
// LLM requests the whole site may make per campus date
export const MaxDailyLlmCalls = 600;
