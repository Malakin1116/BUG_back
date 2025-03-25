import { model, Schema } from 'mongoose';

const usersSchema = new Schema(
  {
    name: { type: String, required: false, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ['woman', 'man'], default: 'woman' },
    weight: { type: Number, default: 0 },
    dailySportTime: { type: Number, default: 0 },
    dailyNorm: { type: Number, default: 1500, min: 500, max: 15000 },
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/diee7l1on/image/upload/v1741187439/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3467_bvqe8k.avif',
    },
    isVerified: { type: Boolean, default: false }, // Додано поле для верифікації email
  },
  { timestamps: true, versionKey: false },
);

usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const UsersCollection = model('users', usersSchema);
