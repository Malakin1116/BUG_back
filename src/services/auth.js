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
  const email = payload.email.toLowerCase(); // Перевести email в нижній регістр

  // Перевіряємо, чи є користувач з таким email
  const user = await UsersCollection.findOne({ email });

  if (user) {
    // Якщо користувач знайдений, перевіряємо чи він верифікований
    if (user.isVerified) {
      // Якщо email верифікований
      throw createHttpError(409, 'Email is already in use and verified');
    }
  }

  // Якщо користувач не знайдений, хешуємо пароль
  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  // Створюємо нового користувача
  return await UsersCollection.create({
    ...payload,
    email, // Записуємо email в нижньому регістрі
    password: encryptedPassword,
  });
};

export const requestEmailVerificationToken = async (email) => {
  // Перевести email в нижній регістр
  email = email.toLowerCase();

  const user = await UsersCollection.findOne({ email });
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

export const verifyEmail = async (req, res) => {
  const { token } = req.query; // Токен, що передається через параметр запиту

  try {
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

    // Відповідь для користувача
    res.json({
      status: 200,
      message: 'Email successfully verified',
    });
  } catch {
    // Помилка при верифікації токена
    throw createHttpError(400, 'Invalid or expired verification token');
  }
};

export const loginUser = async (payload) => {
  const email = payload.email.toLowerCase(); // Перевести email в нижній регістр
  const user = await UsersCollection.findOne({ email });
  if (!user) throw createHttpError(404, 'User not found');

  // Перевірка, чи email верифікований
  if (!user.isVerified) {
    throw createHttpError(403, 'Email is not verified');
  }

  const isEqual = await bcrypt.compare(payload.password, user.password);
  if (!isEqual) throw createHttpError(401, 'Incorrect password');

  await SessionsCollection.deleteMany({ userId: user._id });

  return await createSession(user._id);
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
  const user = await UsersCollection.findOne({ email });
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

export const requestResetPwdController = async (req, res) => {
  await requestResetToken(req.body.email);

  res.json({
    status: 200,
    message: 'Reset password email has been successfully sent.',
    data: {},
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
    email: entries.email,
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

  let user = await UsersCollection.findOne({ email: payload.email });
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
