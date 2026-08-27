import logger from "../config/logger.js";

const loggingPlugin = {
  async requestDidStart({ request }) {
    const start = Date.now();

    return {
      async didResolveOperation({ operationName }) {
        logger.info(
          {
            operationName: operationName || "anonymous",
            operationType: request.operationName || "unknown",
          },
          "GraphQL operation started"
        );
      },

      async didEncounterErrors({ errors }) {
        for (const error of errors) {
          logger.error(
            {
              message: error.message,
              path: error.path,
              code: error.extensions?.code,
            },
            "GraphQL operation error"
          );
        }
      },

      async willSendResponse({ operationName, response }) {
        const duration = Date.now() - start;

        logger.info(
          {
            operationName: operationName || "anonymous",
            durationMs: duration,
            hasErrors: Boolean(response.body.singleResult?.errors?.length),
          },
          "GraphQL operation completed"
        );
      },
    };
  },
};

export default loggingPlugin;