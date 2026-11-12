import mongoose from 'mongoose';

const campaignAttemptSchema = new mongoose.Schema(
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
    passed: {
      type: Boolean,
      required: [true, 'Passed boolean status is required']
    },
    stars: {
      type: Number,
      default: 0,
      min: [0, 'Stars cannot be negative'],
      max: [3, 'Stars cannot exceed 3']
    },
    steps: {
      type: Number,
      default: 0,
      min: [0, 'Steps cannot be negative']
    },
    programBlocks: {
      type: Number,
      default: 0,
      min: [0, 'Program blocks cannot be negative']
    },
    reason: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

campaignAttemptSchema.index({ user: 1, levelId: 1, createdAt: -1 });

campaignAttemptSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

campaignAttemptSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CampaignAttempt =
  mongoose.models.CampaignAttempt || mongoose.model('CampaignAttempt', campaignAttemptSchema);

export { campaignAttemptSchema, CampaignAttempt };
export default CampaignAttempt;
