import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and hyphens']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    totalXp: {
      type: Number,
      default: 0,
      min: [0, 'totalXp cannot be negative']
    },
    level: {
      type: Number,
      default: 1,
      min: [1, 'level cannot be less than 1']
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: [0, 'currentStreak cannot be negative']
    },
    lastActiveDate: {
      type: Date,
      default: null
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

// Strips sensitive fields when converting to JSON or plain objects
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

// Instance method to generate safe profile representation
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : undefined,
    username: this.username,
    email: this.email,
    totalXp: this.totalXp,
    level: this.level,
    currentStreak: this.currentStreak,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export { userSchema, User };
export default User;
