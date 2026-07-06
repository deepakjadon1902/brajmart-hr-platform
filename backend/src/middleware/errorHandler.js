import { env, isProduction } from "../config/env.js";

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const payload = {
    success: false,
    message: statusCode === 500 && isProduction ? "Internal server error" : error.message,
  };

  if (error.details && !isProduction) payload.details = error.details;
  if (env.NODE_ENV === "development") payload.stack = error.stack;

  return res.status(statusCode).json(payload);
}
