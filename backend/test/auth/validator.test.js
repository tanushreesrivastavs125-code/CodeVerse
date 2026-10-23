import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegister, validateLogin } from '../../src/validators/auth.validator.js';
import { AppError } from '../../src/middleware/errorHandler.js';

describe('Auth Payload Validation Rules', () => {
  describe('validateRegister', () => {
    test('passes and normalizes valid registration payload', () => {
      const payload = {
        username: '  ValidUser_123  ',
        email: '  Learner@Example.COM  ',
        password: 'Password123!'
      };

      const result = validateRegister(payload);
      assert.equal(result.username, 'ValidUser_123');
      assert.equal(result.email, 'learner@example.com');
      assert.equal(result.password, 'Password123!');
    });

    test('rejects non-object body', () => {
      assert.throws(
        () => validateRegister(null),
        (err) => err instanceof AppError && err.statusCode === 400
      );
      assert.throws(
        () => validateRegister('string'),
        (err) => err instanceof AppError && err.statusCode === 400
      );
      assert.throws(
        () => validateRegister([]),
        (err) => err instanceof AppError && err.statusCode === 400
      );
    });

    test('rejects invalid username (missing, too short, too long, special characters)', () => {
      // Missing
      assert.throws(
        () => validateRegister({ email: 'a@b.com', password: 'password123' }),
        (err) => err instanceof AppError && err.message.includes('Username is required')
      );
      // Too short (< 3)
      assert.throws(
        () => validateRegister({ username: 'ab', email: 'a@b.com', password: 'password123' }),
        (err) => err instanceof AppError && err.message.includes('between 3 and 30 characters')
      );
      // Too long (> 30)
      assert.throws(
        () => validateRegister({ username: 'a'.repeat(31), email: 'a@b.com', password: 'password123' }),
        (err) => err instanceof AppError && err.message.includes('between 3 and 30 characters')
      );
      // Disallowed chars
      assert.throws(
        () => validateRegister({ username: 'user name!', email: 'a@b.com', password: 'password123' }),
        (err) => err instanceof AppError && err.message.includes('alphanumeric')
      );
    });

    test('rejects invalid email (missing, malformed, empty)', () => {
      assert.throws(
        () => validateRegister({ username: 'valid_user', password: 'password123' }),
        (err) => err instanceof AppError && err.message.includes('Email is required')
      );
      assert.throws(
        () => validateRegister({ username: 'valid_user', email: 'notanemail', password: 'password123' }),
        (err) => err instanceof AppError && err.message.includes('valid email address')
      );
    });

    test('rejects invalid password (missing, too short, too long)', () => {
      assert.throws(
        () => validateRegister({ username: 'valid_user', email: 'a@b.com' }),
        (err) => err instanceof AppError && err.message.includes('Password is required')
      );
      assert.throws(
        () => validateRegister({ username: 'valid_user', email: 'a@b.com', password: '123' }),
        (err) => err instanceof AppError && err.message.includes('between 6 and 100 characters')
      );
      assert.throws(
        () => validateRegister({ username: 'valid_user', email: 'a@b.com', password: 'a'.repeat(101) }),
        (err) => err instanceof AppError && err.message.includes('between 6 and 100 characters')
      );
    });
  });

  describe('validateLogin', () => {
    test('passes and normalizes valid login payload', () => {
      const payload = {
        email: '  LEARNER@EXAMPLE.COM  ',
        password: 'Password123!'
      };

      const result = validateLogin(payload);
      assert.equal(result.email, 'learner@example.com');
      assert.equal(result.password, 'Password123!');
    });

    test('rejects missing or malformed email', () => {
      assert.throws(
        () => validateLogin({ password: 'Password123!' }),
        (err) => err instanceof AppError && err.statusCode === 400
      );
      assert.throws(
        () => validateLogin({ email: 'bademail', password: 'Password123!' }),
        (err) => err instanceof AppError && err.statusCode === 400
      );
    });

    test('rejects missing or empty password', () => {
      assert.throws(
        () => validateLogin({ email: 'user@example.com' }),
        (err) => err instanceof AppError && err.statusCode === 400
      );
      assert.throws(
        () => validateLogin({ email: 'user@example.com', password: '' }),
        (err) => err instanceof AppError && err.statusCode === 400
      );
    });
  });
});
