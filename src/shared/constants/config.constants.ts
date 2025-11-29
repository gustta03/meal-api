export const CONFIG = {
  SERVER: {
    DEFAULT_PORT: 3000,
    DEFAULT_HOST: "0.0.0.0",
  },
  DATABASE: {
    DEFAULT_URI: "mongodb://admin:admin123@localhost:27017/?authSource=admin",
    DEFAULT_DB_NAME: "bot-nutri",
  },
  GEMINI: {
    DEFAULT_MODEL: "gemini-2.0-flash",
    VISION_MODEL: "gemini-2.0-flash",
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2048,
  },
  TACO: {
    API_URL: process.env.TACO_API_URL,
  },
  WHAPI: {
    API_URL: process.env.WHAPI_API_URL || "https://gate.whapi.cloud",
    API_TOKEN: process.env.WHAPI_API_TOKEN,
    CHANNEL_ID: process.env.WHAPI_CHANNEL_ID,
  },
} as const;
