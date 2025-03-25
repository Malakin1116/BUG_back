import nodemailer from 'nodemailer';

import { SMTP } from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';

const transporter = nodemailer.createTransport({
  host: getEnvVar(SMTP.SMTP_HOST),
  port: Number(getEnvVar(SMTP.SMTP_PORT)),
  auth: {
    user: getEnvVar(SMTP.SMTP_USER),
    pass: getEnvVar(SMTP.SMTP_PASSWORD),
  },
});

export const sendEmail = async (options) => {
  try {
    console.log('SMTP Host:', getEnvVar('SMTP_HOST'));
    console.log('SMTP User:', getEnvVar('SMTP_USER'));
    console.log('Sending email to:', options.to);

    const info = await transporter.sendMail(options);
    console.log('Email sent:', info.response);

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
