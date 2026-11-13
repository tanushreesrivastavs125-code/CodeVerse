import mongoose from 'mongoose';

const guildMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Player reference is required']
    },
    guild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guild',
      required: [true, 'Guild reference is required'],
      index: true
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: false
  }
);

// Database-enforced uniqueness: at most one active guild membership per player
guildMembershipSchema.index(
  { user: 1 },
  {
    unique: true,
    name: 'unique_user_active_guild'
  }
);

// Query index for deterministic membership ordering by joinedAt and ID tie-break
guildMembershipSchema.index(
  { guild: 1, joinedAt: 1, _id: 1 },
  {
    name: 'guild_joined_order'
  }
);

guildMembershipSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

guildMembershipSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const GuildMembership =
  mongoose.models.GuildMembership || mongoose.model('GuildMembership', guildMembershipSchema);

export { guildMembershipSchema, GuildMembership };
export default GuildMembership;
