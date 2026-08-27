// Development
// import pino from "pino";

// const logger = pino({
//   level: process.env.LOG_LEVEL || "info",

//   base: {
//     service: "crm-graphql",
//   },

//   timestamp: pino.stdTimeFunctions.isoTime,
// });

// export default logger;

import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export default logger;