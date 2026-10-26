import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, ConfigurationError } from '../../src/config/env.js';

describe('Environment Configuration Validation', () => {
  test('returns sensible defaults when optional environment variables are absent', () => {
    const config = validateConfig({});

    assert.equal(config.port, 5000);
    assert.equal(config.nodeEnv, 'development');
    assert.equal(config.corsOrigin, 'http://localhost:5173');
    assert.equal(config.mongoUri, 'mongodb://localhost:27017/codeverse');
    assert.equal(config.jwtExpiresIn, '24h');
  });

  test('parses and validates custom valid configuration values', () => {
    const rawEnv = {
      PORT: '8080',
      NODE_ENV: 'test',
      CORS_ORIGIN: 'https://codeverse.example.com',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/custom_db',
      JWT_EXPIRES_IN: '12h'
    };

    const config = validateConfig(rawEnv);

    assert.equal(config.port, 8080);
    assert.equal(config.nodeEnv, 'test');
    assert.equal(config.corsOrigin, 'https://codeverse.example.com');
    assert.equal(config.mongoUri, 'mongodb://127.0.0.1:27017/custom_db');
    assert.equal(config.jwtExpiresIn, '12h');
  });

  test('accepts mongodb+srv URI schema', () => {
    const rawEnv = {
      MONGODB_URI: 'mongodb+srv://user:pass@cluster0.abc.mongodb.net/codeverse'
    };
    const config = validateConfig(rawEnv);
    assert.equal(config.mongoUri, 'mongodb+srv://user:pass@cluster0.abc.mongodb.net/codeverse');
  });

  test('throws ConfigurationError on invalid PORT', () => {
    const invalidPorts = ['not-a-number', '-10', '0', '65536', '3.14'];

    for (const port of invalidPorts) {
      assert.throws(
        () => validateConfig({ PORT: port }),
        (err) => err instanceof ConfigurationError && err.message.includes('Invalid PORT'),
        `Expected ConfigurationError for port: ${port}`
      );
    }
  });

  test('throws ConfigurationError on invalid NODE_ENV', () => {
    assert.throws(
      () => validateConfig({ NODE_ENV: 'staging' }),
      (err) => err instanceof ConfigurationError && err.message.includes('Invalid NODE_ENV')
    );
  });

  test('requires MONGODB_URI in production environment', () => {
    assert.throws(
      () => validateConfig({ NODE_ENV: 'production' }),
      (err) => err instanceof ConfigurationError && err.message.includes('MONGODB_URI is required in production')
    );

    assert.throws(
      () => validateConfig({ NODE_ENV: 'production', MONGODB_URI: '   ' }),
      (err) => err instanceof ConfigurationError && err.message.includes('MONGODB_URI is required in production')
    );
  });

  test('accepts valid MONGODB_URI in production environment without inventing secrets', () => {
    const config = validateConfig({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://prod-cluster.mongodb.net/codeverse'
    });
    assert.equal(config.nodeEnv, 'production');
    assert.equal(config.mongoUri, 'mongodb+srv://prod-cluster.mongodb.net/codeverse');
    assert.equal(config.jwtSecret, undefined);
  });

  test('throws ConfigurationError on invalid MONGODB_URI format', () => {
    const invalidUris = ['http://localhost:27017', 'postgres://localhost:5432/db', 'redis://localhost:6379'];

    for (const uri of invalidUris) {
      assert.throws(
        () => validateConfig({ MONGODB_URI: uri }),
        (err) => err instanceof ConfigurationError && err.message.includes('Invalid MONGODB_URI')
      );
    }
  });

  test('invalid MONGODB_URI validation error does not contain the supplied URI', () => {
    const suppliedRawUri = 'http://private-db.internal.corp:27017/my_database';

    try {
      validateConfig({ MONGODB_URI: suppliedRawUri });
      assert.fail('Expected validateConfig to throw ConfigurationError');
    } catch (err) {
      assert.ok(err instanceof ConfigurationError);
      assert.ok(!err.message.includes(suppliedRawUri), 'ConfigurationError must not leak supplied raw URI');
      assert.ok(!err.message.includes('private-db.internal.corp'), 'ConfigurationError must not leak internal host');
      assert.ok(err.message.includes('Invalid MONGODB_URI. Connection string must start with "mongodb://" or "mongodb+srv://".'));
    }
  });

  test('invalid URI containing a fake password does not expose that password in the resulting error', () => {
    const fakePassword = 'SuperSecretFakePassword123!';
    const rawUriWithCredentials = `postgres://app_user:${fakePassword}@localhost:5432/codeverse`;

    try {
      validateConfig({ MONGODB_URI: rawUriWithCredentials });
      assert.fail('Expected validateConfig to throw ConfigurationError');
    } catch (err) {
      assert.ok(err instanceof ConfigurationError);
      assert.ok(!err.message.includes(fakePassword), 'ConfigurationError must never expose password credentials');
      assert.ok(!err.message.includes('app_user'), 'ConfigurationError must not expose username');
      assert.ok(!err.message.includes(rawUriWithCredentials), 'ConfigurationError must not expose the connection string');
    }
  });

  test('throws ConfigurationError when CORS_ORIGIN is empty string', () => {
    assert.throws(
      () => validateConfig({ CORS_ORIGIN: '   ' }),
      (err) => err instanceof ConfigurationError && err.message.includes('Invalid CORS_ORIGIN')
    );
  });
});
