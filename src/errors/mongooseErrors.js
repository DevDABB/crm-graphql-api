import { badRequest } from "./index.js";

const handleMongooseError = (error) => {
  // ID inválido
  if (error.name === "CastError") {
    return badRequest(
      "Invalid ID",
      "INVALID_ID"
    );
  }

  // Validación del Schema de Mongoose
  if (error.name === "ValidationError") {
    return badRequest(
      "Validation error",
      "VALIDATION_ERROR"
    );
  }

  // Campo único duplicado
  if (error.code === 11000) {
    return badRequest(
      "Resource already exists",
      "DUPLICATE_RESOURCE"
    );
  }

  return error;
};

export default handleMongooseError;