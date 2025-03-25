import dotenv from 'dotenv';
dotenv.config();

export const getEnvVar = (key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return process.env[key];
};
