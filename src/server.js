import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { depthLimit } from "@graphile/depth-limit";
import { createComplexityLimitRule } from "graphql-validation-complexity";
import { GraphQLError } from "graphql";
import "dotenv/config";

import typeDefs from "./graphql/schema.js";
import resolvers from "./graphql/resolvers.js";
import { verifyToken } from "./auth.js";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import createCategoryLoader from "./loaders/categoryLoader.js";
import AppError from "./errors/AppError.js";
import handleMongooseError from "./errors/mongooseErrors.js";
import { connectRedis } from "./config/redis.js";
import { checkRateLimit } from "./services/rateLimitService.js";
import logger from "./config/logger.js";
import loggingPlugin from "./plugins/loggingPlugin.js";

const securityHeadersPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse({ response }) {
        response.http.headers.set(
          "X-Content-Type-Options",
          "nosniff"
        );

        response.http.headers.set(
          "X-Frame-Options",
          "DENY"
        );

        response.http.headers.set(
          "Referrer-Policy",
          "no-referrer"
        );

        response.http.headers.set(
          "Permissions-Policy",
          "camera=(), microphone=(), geolocation=()"
        );

        if (process.env.NODE_ENV === "production") {
          response.http.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains"
          );
        }
      },
    };
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,

  validationRules: [
    depthLimit({
      maxDepth: 5,
      maxListDepth: 3,
      maxSelfReferentialDepth: 2,
    }),

    createComplexityLimitRule(50, {
      scalarCost: 1,
      objectCost: 1,
      listFactor: 5,

      onCost: (cost) => {
        logger.info(
          {
            complexity: cost,
          },
          "GraphQL query complexity"
        );
      },

      formatErrorMessage: (cost) =>
        `Query complexity ${cost} exceeds the maximum allowed complexity of 50`,
    }),
  ],

  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
    }),

    securityHeadersPlugin,

    loggingPlugin,
  ],

  formatError: (formattedError, error) => {
    const originalError = error.originalError;

    if (originalError instanceof AppError) {
      return {
        message: originalError.message,
        extensions: {
          code: originalError.code,
          statusCode: originalError.statusCode,
        },
      };
    }

    const normalizedError = handleMongooseError(originalError);

    if (normalizedError instanceof AppError) {
      return {
        message: normalizedError.message,
        extensions: {
          code: normalizedError.code,
          statusCode: normalizedError.statusCode,
        },
      };
    }

    return formattedError;
  },
});

await connectDB();
await connectRedis();

const { url } = await startStandaloneServer(server, {
  listen: {
    port: Number(process.env.PORT) || 4000,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },

  context: async ({ req }) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.allowed) {
      logger.warn(
        {
          ip,
        },
        "Rate limit exceeded"
      );

      throw new GraphQLError("Too many requests", {
        extensions: {
          code: "RATE_LIMIT_EXCEEDED",
        },
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return {
        user: null,
        categoryLoader: createCategoryLoader(),
      };
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const payload = verifyToken(token);

      const user = await User.findById(payload.userId);

      return {
        user,
        categoryLoader: createCategoryLoader(),
      };
    } catch (error) {
      return {
        user: null,
        categoryLoader: createCategoryLoader(),
      };
    }
  },
});

logger.info(
  {
    url,
    environment: process.env.NODE_ENV || "development",
  },
  "GraphQL server started"
);