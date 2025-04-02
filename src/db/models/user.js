import { model, Schema, mongoose } from 'mongoose';
import {  decrypt } from '../../utils/encryption.js';

const usersSchema = new Schema(
  {
    name: { type: String, required: false, default: '' },
    email: {
      type: String,
      required: true,
    },
    emailHash: { type: String, required: false, unique: true },
    password: {
      type: String,
      required: true,
    },
    budget: { type: Number, required: false, default: 0 }, // Початковий бюджет
    budgetStartDate: { type: Date, required: false }, // Дата початку підрахунку бюджету
    isVerified: { type: Boolean, default: true },
    emailIV: { type: String, required: false },
  },
  { timestamps: true, versionKey: false }
);

usersSchema.methods.decryptEmail = function () {
  return decrypt(this.email, this.emailIV);
};

usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailIV;
  delete obj.emailHash;
  return obj;
};

export const UsersCollection = mongoose.models.users || model('users', usersSchema);