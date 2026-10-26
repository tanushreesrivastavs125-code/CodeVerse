import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../config/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Registers a new user account.
 *
 * @param {{ username: string, email: string, password: string }} data
 * @returns {Promise<{ token: string, user: { id: string, username: string, email: string, totalXp: number, level: number } }>}
 */
export async function register({ username, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  // Check for existing user by email or username
  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: trimmedUsername }]
  });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS');
    }
    throw new AppError('This username is already taken.', 409, 'USERNAME_ALREADY_EXISTS');
  }

  // Hash password with bcryptjs (salt rounds = 10)
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  let newUser;
  try {
    newUser = await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      password: passwordHash
    });
  } catch (err) {
    // Handle concurrent duplicate key collisions from MongoDB index
    if (err.code === 11000) {
      const isEmail = err.keyPattern && err.keyPattern.email;
      if (isEmail) {
        throw new AppError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS');
      }
      throw new AppError('This username is already taken.', 409, 'USERNAME_ALREADY_EXISTS');
    }
    throw err;
  }

  const token = signToken({
    id: newUser._id ? newUser._id.toString() : newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role || 'user'
  });

  return {
    token,
    user: {
      id: newUser._id ? newUser._id.toString() : newUser.id,
      username: newUser.username,
      email: newUser.email,
      totalXp: newUser.totalXp ?? 0,
      level: newUser.level ?? 1
    }
  };
}

/**
 * Authenticates user credentials and issues a signed JWT token.
 *
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ token: string, user: { id: string, username: string, email: string, totalXp: number, level: number } }>}
 */
export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Generic error to prevent email enumeration attacks
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken({
    id: user._id ? user._id.toString() : user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user'
  });

  return {
    token,
    user: {
      id: user._id ? user._id.toString() : user.id,
      username: user.username,
      email: user.email,
      totalXp: user.totalXp ?? 0,
      level: user.level ?? 1
    }
  };
}

/**
 * Retrieves the authenticated user profile.
 * Distinguishes database/infrastructure failures (500 DATABASE_ERROR) from genuine missing users (404 USER_NOT_FOUND).
 * Never swallows database errors or returns fallback profiles constructed from JWT claims.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getProfile(userId) {
  let user;

  try {
    const query = User.findById(userId);
    if (query && typeof query.select === 'function') {
      user = await query.select('-password');
    } else if (query && typeof query.then === 'function') {
      user = await query;
    } else {
      user = query;
    }
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    // Database or infrastructure failure: do not leak raw driver or connection error details
    throw new AppError('Unable to retrieve user profile due to a database error.', 500, 'DATABASE_ERROR');
  }

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  if (typeof user.toSafeObject === 'function') {
    return user.toSafeObject();
  }

  return {
    id: user._id ? user._id.toString() : (user.id || userId),
    username: user.username,
    email: user.email,
    totalXp: user.totalXp ?? 0,
    level: user.level ?? 1,
    currentStreak: user.currentStreak ?? 0,
    role: user.role || 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
