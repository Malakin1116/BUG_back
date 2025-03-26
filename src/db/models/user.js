import { model, Schema } from 'mongoose';
import { encrypt, decrypt } from '../../utils/encryption.js'; 

const usersSchema = new Schema(
  {
    name: { type: String, required: false, default: '' },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true }, 
    budget: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    emailIV: { type: String, required: false }, 
  },
  { timestamps: true, versionKey: false }
);


usersSchema.pre('save', async function (next) {
  if (this.isModified('email')) {
    const { iv, encryptedData } = encrypt(this.email);
    this.email = encryptedData;
    this.emailIV = iv;
  }
  next();
});

usersSchema.methods.decryptEmail = function () {
  return decrypt(this.email, this.emailIV);
};


usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailIV;
  return obj;
};

export const UsersCollection = model('users', usersSchema);