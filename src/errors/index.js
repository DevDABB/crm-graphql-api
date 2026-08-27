import AppError from "./AppError.js";

const notFound = (message, code) => {
  return new AppError(message, code, 404);
};

const badRequest = (message, code) => {
  return new AppError(message, code, 400);
};

const unauthorized = (message = "Authentication required") => {
  return new AppError(message, "UNAUTHENTICATED", 401);
};

const forbidden = (message = "Access denied") => {
  return new AppError(message, "FORBIDDEN", 403);
};

export {
  notFound,
  badRequest,
  unauthorized,
  forbidden
};