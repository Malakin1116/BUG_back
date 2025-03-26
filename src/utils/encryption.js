import crypto from 'crypto';
import { getEnvVar } from './getEnvVar.js';

const algorithm = 'aes-256-cbc';
const rawKey = getEnvVar('ENC_KEY');

const key = Buffer.from(rawKey, 'hex');
console.log('Key length (bytes):', key.length); // Має бути 32

export const encrypt = (text) => {
    const iv = crypto.randomBytes(16); // Генеруємо унікальний IV для кожного шифрування
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
};

export const decrypt = (encryptedData, iv) => {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};