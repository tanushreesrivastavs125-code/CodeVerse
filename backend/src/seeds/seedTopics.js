import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from '../config/env.js';
import { connectDatabase, disconnectDatabase, getDatabaseStatus } from '../config/database.js';
import Topic from '../models/Topic.js';
import { beginnerTopics } from './topics.data.js';

/**
 * Seeds the database with canonical beginner learning topics.
 * This operation is strictly idempotent: re-running it updates existing topics without duplicates.
 * Preserves any existing unrelated topics in the database.
 * Production environments are protected and require explicit confirmation via options.force or FORCE_SEED=true.
 *
 * @param {object} [options={}] - Seeder execution options
 * @param {boolean} [options.disconnectOnFinish=false] - Whether to close DB connection after completion
 * @param {boolean} [options.force=false] - Force execution even in production environment
 * @param {boolean} [options.quiet=false] - Suppress informational console output
 * @returns {Promise<{ insertedCount: number, updatedCount: number, totalProcessed: number, topics: Array<object> }>}
 */
export async function seedTopics(options = {}) {
  const {
    disconnectOnFinish = false,
    force = false,
    quiet = false
  } = options;

  // Safety guard: Never accidentally seed production without explicit authorization
  if (config.nodeEnv === 'production' && !force && process.env.FORCE_SEED !== 'true') {
    throw new Error(
      'Automatic seeding in production is disabled for safety. Set FORCE_SEED=true to seed production.'
    );
  }

  // Ensure database is connected
  const dbStatus = getDatabaseStatus();
  let locallyConnected = false;
  if (dbStatus.state !== 'connected') {
    if (!quiet) {
      console.log('[Seed] Connecting to MongoDB for curriculum seeding...');
    }
    await connectDatabase();
    locallyConnected = true;
  }

  try {
    let insertedCount = 0;
    let updatedCount = 0;
    const processedTopics = [];

    for (const topicData of beginnerTopics) {
      const existing = await Topic.findOne({ slug: topicData.slug });
      const isNew = !existing;

      const topic = await Topic.findOneAndUpdate(
        { slug: topicData.slug },
        { $set: topicData },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      if (isNew) {
        insertedCount++;
      } else {
        updatedCount++;
      }
      processedTopics.push(topic);
    }

    if (!quiet) {
      console.log(`[Seed] Curriculum topics seeded successfully: ${insertedCount} inserted, ${updatedCount} updated (${processedTopics.length} total).`);
    }

    return {
      insertedCount,
      updatedCount,
      totalProcessed: processedTopics.length,
      topics: processedTopics
    };
  } finally {
    if (disconnectOnFinish || locallyConnected) {
      try {
        await disconnectDatabase();
        if (!quiet) {
          console.log('[Seed] MongoDB connection closed.');
        }
      } catch (err) {
        if (!quiet) {
          console.warn(`[Seed] Error closing database connection: ${err.message}`);
        }
      }
    }
  }
}

/**
 * Checks whether this file is being executed directly via node CLI.
 */
function isMainModule() {
  if (!process.argv[1]) {
    return false;
  }
  try {
    const scriptPath = path.resolve(process.argv[1]);
    const modulePath = path.resolve(fileURLToPath(import.meta.url));
    return scriptPath.toLowerCase() === modulePath.toLowerCase();
  } catch {
    return false;
  }
}

// Automatically execute when called directly from CLI
if (isMainModule()) {
  seedTopics({ disconnectOnFinish: true })
    .then((result) => {
      console.log(`[Seed] Completed. ${result.totalProcessed} topics ready.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[Seed] Error during curriculum seeding: ${err.message}`);
      process.exit(1);
    });
}

export default seedTopics;
