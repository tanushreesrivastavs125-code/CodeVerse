import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Guild name is required'],
      trim: true,
      minlength: [3, 'Guild name must be at least 3 characters'],
      maxlength: [30, 'Guild name cannot exceed 30 characters']
    },
    normalizedName: {
      type: String,
      required: [true, 'Normalized guild name is required'],
      trim: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [250, 'Guild description cannot exceed 250 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guild owner reference is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Database-enforced uniqueness for normalized guild name
guildSchema.index(
  { normalizedName: 1 },
  {
    unique: true,
    name: 'unique_guild_normalized_name'
  }
);

guildSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

guildSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Guild = mongoose.models.Guild || mongoose.model('Guild', guildSchema);

export { guildSchema, Guild };
export default Guild;
