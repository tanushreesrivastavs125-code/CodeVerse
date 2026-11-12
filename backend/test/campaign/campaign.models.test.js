import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import CampaignProgress, { campaignProgressSchema } from '../../src/models/CampaignProgress.js';
import CampaignAttempt, { campaignAttemptSchema } from '../../src/models/CampaignAttempt.js';

describe('Campaign Mongoose Models & Schema Invariants', () => {
  describe('CampaignProgress Schema Invariants', () => {
    test('validates successfully with compliant progress attributes', async () => {
      const doc = new CampaignProgress({
        user: new mongoose.Types.ObjectId(),
        levelId: 1,
        campaignVersion: 'v1',
        stars: 3
      });

      await assert.doesNotReject(async () => {
        await doc.validate();
      });

      assert.equal(doc.stars, 3);
      assert.equal(doc.attempts, 1);
      assert.equal(doc.xpAwarded, 100);
      assert.equal(doc.coinsAwarded, 25);
      assert.equal(doc.campaignVersion, 'v1');
      assert.ok(doc.firstCompletedAt instanceof Date);
      assert.ok(doc.lastCompletedAt instanceof Date);
    });

    test('enforces required fields: user, levelId, stars', async () => {
      const emptyDoc = new CampaignProgress({});
      await assert.rejects(
        async () => {
          await emptyDoc.validate();
        },
        (err) => {
          assert.ok(err.errors.user);
          assert.ok(err.errors.levelId);
          assert.ok(err.errors.stars);
          return true;
        }
      );
    });

    test('enforces stars bounds: min 1 and max 3', async () => {
      const invalidLow = new CampaignProgress({
        user: new mongoose.Types.ObjectId(),
        levelId: 1,
        stars: 0
      });
      await assert.rejects(async () => await invalidLow.validate(), (err) => Boolean(err.errors.stars));

      const invalidHigh = new CampaignProgress({
        user: new mongoose.Types.ObjectId(),
        levelId: 1,
        stars: 4
      });
      await assert.rejects(async () => await invalidHigh.validate(), (err) => Boolean(err.errors.stars));
    });

    test('declares unique compound index on user, levelId, and campaignVersion', () => {
      const indexes = campaignProgressSchema.indexes();
      const uniqueCompound = indexes.find(
        ([fields, options]) =>
          fields.user === 1 &&
          fields.levelId === 1 &&
          fields.campaignVersion === 1 &&
          options?.unique === true
      );
      assert.ok(uniqueCompound, 'Must declare unique compound index { user: 1, levelId: 1, campaignVersion: 1 }');
    });

    test('toJSON and toObject transform removes __v and converts _id to id', () => {
      const doc = new CampaignProgress({
        user: new mongoose.Types.ObjectId(),
        levelId: 1,
        stars: 2
      });
      const json = doc.toJSON();
      assert.ok(json.id);
      assert.equal(json._id, undefined);
      assert.equal(json.__v, undefined);
    });
  });

  describe('CampaignAttempt Schema Invariants', () => {
    test('validates successfully with compliant attempt attributes', async () => {
      const attempt = new CampaignAttempt({
        user: new mongoose.Types.ObjectId(),
        levelId: 1,
        passed: true,
        stars: 2,
        steps: 6,
        programBlocks: 4,
        reason: 'Sector secured.'
      });

      await assert.doesNotReject(async () => {
        await attempt.validate();
      });

      assert.equal(attempt.passed, true);
      assert.equal(attempt.stars, 2);
      assert.equal(attempt.campaignVersion, 'v1');
    });

    test('enforces required fields: user, levelId, passed', async () => {
      const emptyAttempt = new CampaignAttempt({});
      await assert.rejects(
        async () => {
          await emptyAttempt.validate();
        },
        (err) => {
          assert.ok(err.errors.user);
          assert.ok(err.errors.levelId);
          assert.ok(err.errors.passed);
          return true;
        }
      );
    });

    test('declares compound query index on user, levelId, and createdAt', () => {
      const indexes = campaignAttemptSchema.indexes();
      const queryIdx = indexes.find(
        ([fields]) => fields.user === 1 && fields.levelId === 1 && fields.createdAt === -1
      );
      assert.ok(queryIdx, 'Must declare index { user: 1, levelId: 1, createdAt: -1 }');
    });
  });
});
