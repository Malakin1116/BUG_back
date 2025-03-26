
// import { model, Schema } from 'mongoose';

// const usersSchema = new Schema(
//   {
//     name: { type: String, required: false, default: ''  },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     budget: { type: Number, default: 0 }, 
//     isVerified: { type: Boolean, default: true },
//   },
//   { timestamps: true, versionKey: false }
// );

// usersSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.password;
//   return obj;
// };

// export const UsersCollection = model('users', usersSchema);

import { model, Schema } from 'mongoose';
import { encrypt, decrypt } from '../../utils/encryption.js'; // Імпортуємо утиліти шифрування

const usersSchema = new Schema(
  {
    name: { type: String, required: false, default: '' },
    email: { type: String, required: true, unique: true }, // Зберігатимемо зашифрований email
    password: { type: String, required: true }, // Пароль уже хешований, його не чіпаємо
    budget: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    emailIV: { type: String, required: false }, // Змінюємо required на false
  },
  { timestamps: true, versionKey: false }
);

// Перед збереженням шифруємо email
usersSchema.pre('save', async function (next) {
  if (this.isModified('email')) {
    const { iv, encryptedData } = encrypt(this.email);
    this.email = encryptedData;
    this.emailIV = iv;
  }
  next();
});

// Метод для дешифрування email
usersSchema.methods.decryptEmail = function () {
  return decrypt(this.email, this.emailIV);
};

// Перевизначаємо toJSON, щоб не повертати зашифровані дані та IV
usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailIV;
  return obj;
};

export const UsersCollection = model('users', usersSchema);