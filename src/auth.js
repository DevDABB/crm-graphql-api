import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const requireAuth = (context) => {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }

  return context.user;
};

const requireRole = (context, role) => {
  requireAuth(context);

  if (context.user.role !== role) {
    throw new GraphQLError("You do not have permission", {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }

  return context.user;
};

export {
  generateToken,
  verifyToken,
  requireAuth,
  requireRole,
};