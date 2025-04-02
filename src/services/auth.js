import { UsersCollection } from '../db/models/user.js';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import { isValidObjectId } from 'mongoose';

import { FIFTEEN_MINUTES, ONE_DAY, TEMPLATES_DIR } from '../constants/index.js';
import { SessionsCollection } from '../db/models/session.js';
import { SMTP } from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { sendEmail } from '../utils/sendMail.js';
import {
  getFullNameFromGoogleTokenPayload,
  validateCode,
} from '../utils/googleOAuth2.js';
// import { encrypt } from '../utils/encryption.js'; // Виправлено імпорт
import { createHash } from 'crypto';
import { encrypt } from '../utils/encryption.js';

const createSession = async (userId) => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  const session = await SessionsCollection.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });

  console.log(`Session created for user ${userId}:`, session);

  return session;
};

export const registerUser = async (payload) => {
  const { email, password, budget, budgetStartDate } = payload;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error('Password must be at least 6 characters long and contain at least one letter and one number');
  }
  const normalizedEmail = email.toLowerCase();
  const encryptedPassword = await bcrypt.hash(password, 10);
  const emailHash = createHash('sha256')
    .update(normalizedEmail)
    .digest('hex');
  const { iv, encryptedData } = encrypt(normalizedEmail);
  let initialBudget = 0;
  if (budget !== undefined) {
    initialBudget = Number(budget);
    if (isNaN(initialBudget)) {
      throw new Error('Budget must be a valid number');
    }
  }
  let startDate = null;
  if (budgetStartDate) {
    startDate = new Date(budgetStartDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('Budget start date must be a valid date');
    }
  }
  const user = await UsersCollection.create({
    ...payload,
    email: encryptedData,
    emailHash,
    emailIV: iv,
    password: encryptedPassword,
    budget: initialBudget,
    budgetStartDate: startDate,
  });
  return user;
};

export const loginUser = async (payload) => {
  const email = payload.email.toLowerCase(); // Переводимо email у нижній регістр
  // Завантажуємо всіх користувачів і шукаємо вручну
  const users = await UsersCollection.find();
  let existingUser = null;
  for (const user of users) {
    const decryptedEmail = user.decryptEmail();
    if (decryptedEmail === email) {
      existingUser = user;
      break;
    }
  }
  if (!existingUser) {
    throw createHttpError(404, 'User not found');
  }
  const isEqual = await bcrypt.compare(payload.password, existingUser.password);
  if (!isEqual) {
    throw createHttpError(401, 'Incorrect password');
  }
  await SessionsCollection.deleteMany({ userId: existingUser._id });
  return await createSession(existingUser._id);
};

export const requestEmailVerificationToken = async (email) => {
  // Перевести email в нижній регістр
  email = email.toLowerCase();

  // Шукаємо користувача по email
  const users = await UsersCollection.find();
  let user = null;
  for (const u of users) {
    const decryptedEmail = u.decryptEmail();
    if (decryptedEmail === email) {
      user = u;
      break;
    }
  }
  if (!user) throw createHttpError(404, 'User not found');

  // Перевірка, чи користувач уже підтвердив свою пошту
  if (user.isVerified) {
    throw createHttpError(400, 'Email already verified');
  }

  const verificationToken = jwt.sign(
    { sub: user._id, email },
    getEnvVar('JWT_SECRET'),
    { expiresIn: '15m' },
  );

  const verificationEmailTemplatePath = path.join(
    TEMPLATES_DIR,
    'verify-email.html',
  );

  const templateSource = await fs.readFile(
    verificationEmailTemplatePath,
    'utf-8',
  );
  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/signin?token=${verificationToken}`,
  });

  await sendEmail({
    from: getEnvVar(SMTP.SMTP_FROM),
    to: email,
    subject: 'Verify your email',
    html,
  });
};

export const verifyEmail = async (req) => {
  const { token } = req.query; // Токен, що передається через параметр запиту

  // Верифікація токена
  const decoded = jwt.verify(token, getEnvVar('JWT_SECRET'));

  // Знаходимо користувача за ID, який міститься в токені
  const user = await UsersCollection.findById(decoded.sub);
  if (!user) throw createHttpError(404, 'User not found');

  // Перевіряємо, чи користувач вже підтвердив свою email адресу
  if (user.isVerified) {
    throw createHttpError(400, 'Email already verified');
  }

  // Оновлюємо статус користувача на підтверджений
  user.isVerified = true;
  await user.save(); // Зберігаємо зміни в базі
};

export const logoutUser = async (sessionId) => {
  if (!isValidObjectId(sessionId)) {
    throw createHttpError(400, 'Invalid session ID');
  }
  await SessionsCollection.deleteOne({ _id: sessionId });
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
  if (!isValidObjectId(sessionId)) {
    throw createHttpError(400, 'Invalid session ID');
  }
  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });
  if (!session) throw createHttpError(401, 'Session not found');
  if (new Date() > new Date(session.refreshTokenValidUntil)) {
    throw createHttpError(401, 'Session token expired');
  }
  await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });
  return await createSession(session.userId);
};

export const requestResetToken = async (email) => {
  // Шукаємо користувача по email
  const users = await UsersCollection.find();
  let user = null;
  for (const u of users) {
    const decryptedEmail = u.decryptEmail();
    if (decryptedEmail === email.toLowerCase()) {
      user = u;
      break;
    }
  }
  if (!user) throw createHttpError(404, 'User not found');

  const resetToken = jwt.sign(
    { sub: user._id, email },
    getEnvVar('JWT_SECRET'),
    { expiresIn: '15m' },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = await fs.readFile(resetPasswordTemplatePath, 'utf-8');
  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  await sendEmail({
    from: getEnvVar(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
  });
};

export const resetPassword = async (payload) => {
  let entries;
  try {
    entries = jwt.verify(payload.token, getEnvVar('JWT_SECRET'));
  } catch (err) {
    throw createHttpError(401, err.message);
  }

  const user = await UsersCollection.findOne({
    _id: entries.sub,
  });

  if (!user) throw createHttpError(404, 'User not found');

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};

export const loginOrSignupWithGoogle = async (code) => {
  const loginTicket = await validateCode(code);
  const payload = loginTicket.getPayload();
  if (!payload) throw createHttpError(401);

  let user = null;
  const users = await UsersCollection.find();
  for (const u of users) {
    const decryptedEmail = u.decryptEmail();
    if (decryptedEmail === payload.email.toLowerCase()) {
      user = u;
      break;
    }
  }

  if (!user) {
    const password = await bcrypt.hash(randomBytes(10).toString('hex'), 10);
    user = await UsersCollection.create({
      email: payload.email,
      name: getFullNameFromGoogleTokenPayload(payload),
      password,
    });
  }

  await SessionsCollection.deleteMany({ userId: user._id });

  return await createSession(user._id);
};