class AppError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export default AppError;