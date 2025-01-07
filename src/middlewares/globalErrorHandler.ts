import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  //Express expects error handlers to just send the response and be done, not return values
  res.status(statusCode).json({
    message: err.message,
    errorStack: config.env === "development" ? err.stack : "",
  });
};

export default globalErrorHandler;
