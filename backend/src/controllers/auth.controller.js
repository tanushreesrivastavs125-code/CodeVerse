import * as authService from '../services/authService.js';

/**
 * POST /api/auth/register
 * Handles user registration and returns JWT with safe user profile.
 *
 * @type {import('express').RequestHandler}
 */
export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Handles user authentication and returns signed JWT with safe user profile.
 *
 * @type {import('express').RequestHandler}
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/profile
 * Retrieves authenticated user identity and claims.
 *
 * @type {import('express').RequestHandler}
 */
export async function getProfile(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
}
