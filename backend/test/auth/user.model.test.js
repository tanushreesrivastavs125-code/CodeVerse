import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User, { userSchema } from '../../src/models/User.js';

describe('User Mongoose Model & Schema Invariants', () => {
  test('validates successfully with compliant user attributes', async () => {
    const rawPassword = 'SecurePassword123!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = new User({
      username: 'code_runner_99',
      email: 'Learner@CodeVerse.IO',
      password: passwordHash
    });

    await assert.doesNotReject(async () => {
      await user.validate();
    }, 'Valid user should not produce validation errors');

    assert.equal(user.email, 'learner@codeverse.io', 'Email must be normalized to lowercase');
    assert.equal(user.totalXp, 0, 'totalXp must default to 0');
    assert.equal(user.level, 1, 'level must default to 1');
    assert.equal(user.currentStreak, 0, 'currentStreak must default to 0');
    assert.equal(user.lastActiveDate, null, 'lastActiveDate must default to null');
    assert.equal(user.role, 'user', 'role must default to "user"');
  });

  test('enforces required constraints on username, email, and password', async () => {
    const user = new User({});
    await assert.rejects(
      async () => {
        await user.validate();
      },
      (err) => {
        assert.ok(err.errors.username, 'Username is required');
        assert.ok(err.errors.email, 'Email is required');
        assert.ok(err.errors.password, 'Password is required');
        return true;
      }
    );
  });

  test('enforces username constraints: minimum length and regex formatting', async () => {
    // Too short
    const shortUser = new User({
      username: 'ab',
      email: 'valid@example.com',
      password: 'validpassword'
    });
    await assert.rejects(
      async () => {
        await shortUser.validate();
      },
      (err) => {
        assert.ok(err.errors.username, 'Username shorter than 3 chars should fail');
        return true;
      }
    );

    // Invalid characters (spaces, special symbols)
    const invalidCharUser = new User({
      username: 'user with spaces!',
      email: 'valid@example.com',
      password: 'validpassword'
    });
    await assert.rejects(
      async () => {
        await invalidCharUser.validate();
      },
      (err) => {
        assert.ok(err.errors.username, 'Username with invalid characters should fail');
        return true;
      }
    );
  });

  test('enforces email format validation', async () => {
    const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain'];

    for (const invalidEmail of invalidEmails) {
      const user = new User({
        username: 'valid_user',
        email: invalidEmail,
        password: 'validpassword'
      });
      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err?.errors?.email, `Email "${invalidEmail}" should fail validation`);
          return true;
        }
      );
    }
  });

  test('enforces role enum constraints', async () => {
    const invalidRoleUser = new User({
      username: 'valid_user',
      email: 'valid@example.com',
      password: 'validpassword',
      role: 'superadmin'
    });
    await assert.rejects(
      async () => {
        await invalidRoleUser.validate();
      },
      (err) => {
        assert.ok(err?.errors?.role, 'Unsupported role should fail validation');
        return true;
      }
    );
  });

  test('toJSON transform removes password and internal properties', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const user = new User({
      username: 'coder_alpha',
      email: 'alpha@example.com',
      password: passwordHash
    });

    const json = user.toJSON();
    assert.equal(json.password, undefined, 'password must be excluded from toJSON output');
    assert.equal(json.__v, undefined, '__v must be excluded from toJSON output');
    assert.ok(json.username === 'coder_alpha');
    assert.ok(json.email === 'alpha@example.com');
  });

  test('toSafeObject returns only non-sensitive user attributes', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const user = new User({
      username: 'coder_beta',
      email: 'beta@example.com',
      password: passwordHash
    });

    const safeObj = user.toSafeObject();
    assert.equal(safeObj.password, undefined, 'password must not be present in toSafeObject');
    assert.equal(safeObj.username, 'coder_beta');
    assert.equal(safeObj.email, 'beta@example.com');
    assert.equal(safeObj.totalXp, 0);
    assert.equal(safeObj.level, 1);
  });

  test('schema declares unique indexes for email and username without duplicates', () => {
    const indexes = userSchema.indexes();
    const emailIndexes = indexes.filter((idx) => idx[0].email === 1 && idx[1]?.unique === true);
    const usernameIndexes = indexes.filter((idx) => idx[0].username === 1 && idx[1]?.unique === true);

    assert.equal(emailIndexes.length, 1, 'Email unique index must be declared exactly once on schema without duplicate indexes');
    assert.equal(usernameIndexes.length, 1, 'Username unique index must be declared exactly once on schema without duplicate indexes');
  });
});
