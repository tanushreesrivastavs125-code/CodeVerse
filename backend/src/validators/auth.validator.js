import { AppError } from '../middleware/errorHandler.js';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates registration input payload.
 *
 * @param {unknown} body - Raw request body
 * @returns {{ username: string, email: string, password: string }} Normalized inputs
 */
export function validateRegister(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a valid JSON object.', 400, 'VALIDATION_ERROR');
  }

  const { username, email, password } = body;

  // 1. Username validation
  if (username === undefined || username === null || typeof username !== 'string') {
    throw new AppError('Username is required and must be a string.', 400, 'VALIDATION_ERROR');
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
    throw new AppError('Username must be between 3 and 30 characters.', 400, 'VALIDATION_ERROR');
  }

  if (!USERNAME_REGEX.test(trimmedUsername)) {
    throw new AppError('Username can only contain alphanumeric characters, underscores, and hyphens.', 400, 'VALIDATION_ERROR');
  }

  // 2. Email validation
  if (email === undefined || email === null || typeof email !== 'string') {
    throw new AppError('Email is required and must be a string.', 400, 'VALIDATION_ERROR');
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
    throw new AppError('A valid email address is required.', 400, 'VALIDATION_ERROR');
  }

  // 3. Password validation
  if (password === undefined || password === null || typeof password !== 'string') {
    throw new AppError('Password is required and must be a string.', 400, 'VALIDATION_ERROR');
  }

  if (password.length < 6 || password.length > 100) {
    throw new AppError('Password must be between 6 and 100 characters.', 400, 'VALIDATION_ERROR');
  }

  return {
    username: trimmedUsername,
    email: trimmedEmail.toLowerCase(),
    password
  };
}

/**
 * Validates login input payload.
 *
 * @param {unknown} body - Raw request body
 * @returns {{ email: string, password: string }} Normalized inputs
 */
export function validateLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a valid JSON object.', 400, 'VALIDATION_ERROR');
  }

  const { email, password } = body;

  // 1. Email validation
  if (email === undefined || email === null || typeof email !== 'string') {
    throw new AppError('Email is required and must be a string.', 400, 'VALIDATION_ERROR');
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0 || !EMAIL_REGEX.test(trimmedEmail)) {
    throw new AppError('A valid email address is required.', 400, 'VALIDATION_ERROR');
  }

  // 2. Password validation
  if (password === undefined || password === null || typeof password !== 'string') {
    throw new AppError('Password is required and must be a string.', 400, 'VALIDATION_ERROR');
  }

  if (password.length === 0) {
    throw new AppError('Password cannot be empty.', 400, 'VALIDATION_ERROR');
  }

  return {
    email: trimmedEmail.toLowerCase(),
    password
  };
}
