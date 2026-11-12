import mongoose from 'mongoose';

const campaignProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    levelId: {
      type: Number,
      required: [true, 'Level identifier is required'],
      min: [1, 'Level identifier must be at least 1']
    },
    campaignVersion: {
      type: String,
      required: [true, 'Campaign version is required'],
      default: 'v1',
      trim: true
    },
    stars: {
      type: Number,
      required: [true, 'Stars earned are required'],
      min: [1, 'Stars must be at least 1'],
      max: [3, 'Stars cannot exceed 3']
    },
    attempts: {
      type: Number,
      default: 1,
      min: [1, 'Attempts must be at least 1']
    },
    firstCompletedAt: {
      type: Date,
      default: Date.now
    },
    lastCompletedAt: {
      type: Date,
      default: Date.now
    },
    xpAwarded: {
      type: Number,
      default: 100,
      min: [0, 'XP awarded cannot be negative']
    },
    coinsAwarded: {
      type: Number,
      default: 25,
      min: [0, 'Coins awarded cannot be negative']
    },
    rewardClaimed: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Database-enforced uniqueness: exactly ONE completion record per user + level + campaignVersion
campaignProgressSchema.index(
  { user: 1, levelId: 1, campaignVersion: 1 },
  {
    unique: true,
    name: 'unique_user_level_campaign_version'
  }
);

// Query optimization index for fetching player campaign status
campaignProgressSchema.index({ user: 1, campaignVersion: 1 });

campaignProgressSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

campaignProgressSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

/**
 * Ensures indexes for CampaignProgress collection are built.
 */
export async function ensureCampaignProgressIndexes() {
  if (mongoose.connection?.readyState === 1) {
    await CampaignProgress.syncIndexes();
  }
}

const CampaignProgress =
  mongoose.models.CampaignProgress || mongoose.model('CampaignProgress', campaignProgressSchema);

export { campaignProgressSchema, CampaignProgress };
export default CampaignProgress;
