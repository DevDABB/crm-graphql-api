import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  base: {
    service: "crm-graphql",
  },

  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;