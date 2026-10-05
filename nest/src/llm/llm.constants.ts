// The API type and model of each step, as FastAPI's model list names them
export const DescribeApiType = 'OpenAI';
export const DescribeModel = 'gpt-6.1-sol';

export const CaptionApiType = 'OpenAI';
export const CaptionModel = 'gpt-6.1-sol';

// FastAPI's library sends OpenAI's models after gpt-4 a temperature of 1 whatever the request says,
// and Google recommends 1 for all Gemini 3 models: https://ai.google.dev/gemini-api/docs/gemini-3
export const Temperature = 1;

export const CaptionsPerPhoto = 3;
export const MaxCaptionLength = 160;

// Photos one user may submit per campus date
export const MaxDailyRoasts = 3;
// LLM requests one user may cause per campus date: 2 per roast, and retries of a caption step that failed
export const MaxDailyUserLlmCalls = 12;
// LLM requests the whole site may make per campus date
export const MaxDailyLlmCalls = 400;
