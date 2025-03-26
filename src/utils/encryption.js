import crypto from 'crypto';
import { getEnvVar } from './getEnvVar.js';

const algorithm = 'aes-256-cbc';
const rawKey = getEnvVar('ENCRYPTION_KEY');
const key = Buffer.from(rawKey, 'hex');

export const encrypt = (text) => {
    const iv = crypto.randomBytes(16); 
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