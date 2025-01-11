import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(createHttpError(400, "Invalid email format"));
  }

  // Password strength validation
  if (password.length < 8) {
    return next(createHttpError(400, "Password must be at least 8 characters"));
  }

  // Check existing user
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return next(createHttpError(409, "User already exists with this email"));
    }
  } catch (err) {
    return next(createHttpError(500, "Error checking existing user"));
  }

  // Hash password
  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (err) {
    return next(createHttpError(500, "Error hashing password"));
  }

  // Create user
  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "Error creating user"));
  }

  // Generate token
  try {
    const token = await sign(
      {
        sub: newUser._id,
      },
      config.jwtSecret as string,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      accessToken: token,
      message: "User created successfully",
    });
  } catch (err) {
    return next(createHttpError(500, "Error generating token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  let user: User | null;

  // First try-catch: Database operations
  try {
    user = await userModel.findOne({ email });
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
  } catch (err) {
    // Specific error for database operations
    return next(createHttpError(500, "Database error occurred"));
  }

  // Second try-catch: Password comparison
  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createHttpError(401, "Invalid credentials"));
    }
  } catch (err) {
    // Specific error for password comparison issues
    return next(createHttpError(500, "Error during password validation"));
  }

  // Third try-catch: Token generation
  try {
    const token = await sign(
      {
        sub: user._id,
      },
      config.jwtSecret as string,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      accessToken: token,
      message: "Login successful",
    });
  } catch (err) {
    // Specific error for token generation issues
    return next(createHttpError(500, "Error generating access token"));
  }
};

export { createUser, loginUser };
