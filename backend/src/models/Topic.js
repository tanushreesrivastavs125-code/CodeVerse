import mongoose from 'mongoose';

const conceptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Concept title is required'],
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    _id: true,
    timestamps: false
  }
);

// Auto-derive slug from concept title if missing
conceptSchema.pre('validate', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Topic title must be at least 2 characters'],
      maxlength: [100, 'Topic title cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Topic slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_-]+$/, 'Topic slug can only contain lowercase alphanumeric characters, underscores, and hyphens']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['frontend', 'backend', 'dsa', 'core', 'general'],
        message: '{VALUE} is not a valid category'
      },
      default: 'frontend',
      lowercase: true,
      trim: true
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: '{VALUE} is not a valid difficulty level'
      },
      default: 'beginner',
      lowercase: true,
      trim: true
    },
    order: {
      type: Number,
      required: [true, 'Topic order is required'],
      min: [0, 'Order cannot be negative'],
      default: 0
    },
    concepts: {
      type: [conceptSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    prerequisites: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Auto-derive slug from topic title if not explicitly set
topicSchema.pre('validate', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Compound indexes for optimal query efficiency
topicSchema.index({ isActive: 1, order: 1 });
topicSchema.index({ category: 1, difficulty: 1 });
topicSchema.index({ order: 1 });

// Transform to JSON
topicSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret.__v;
    if (Array.isArray(ret.concepts)) {
      ret.concepts = ret.concepts.map((concept) => {
        if (concept && typeof concept === 'object') {
          const c = { ...concept };
          if (c._id) {
            c.id = c._id.toString();
          }
          return c;
        }
        return concept;
      });
    }
    return ret;
  }
});

topicSchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret.__v;
    if (Array.isArray(ret.concepts)) {
      ret.concepts = ret.concepts.map((concept) => {
        if (concept && typeof concept === 'object') {
          const c = { ...concept };
          if (c._id) {
            c.id = c._id.toString();
          }
          return c;
        }
        return concept;
      });
    }
    return ret;
  }
});

topicSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : undefined,
    title: this.title,
    slug: this.slug,
    description: this.description,
    category: this.category,
    difficulty: this.difficulty,
    order: this.order,
    concepts: Array.isArray(this.concepts)
      ? this.concepts.map((c) => ({
          id: c._id ? c._id.toString() : undefined,
          title: c.title,
          slug: c.slug,
          description: c.description,
          order: c.order
        }))
      : [],
    isActive: this.isActive,
    isLocked: this.isLocked,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

export { topicSchema, conceptSchema, Topic };
export default Topic;
