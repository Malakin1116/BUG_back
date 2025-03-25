import path from 'node:path';
import fs from 'node:fs/promises';
import { TEMP_UPLOAD_DIR, UPLOAD_DIR } from '../constants/index.js';
import { getEnvVar } from './getEnvVar.js';

export const saveFileToUploadDir = async (file) => {
  try {
    const tempPath = path.join(TEMP_UPLOAD_DIR, file.filename);
    const finalPath = path.join(UPLOAD_DIR, file.filename);

    await fs.rename(tempPath, finalPath);

    return `${getEnvVar('APP_DOMAIN')}/uploads/${file.filename}`;
  } catch (error) {
    console.error(`❌ Error moving file: ${error.message}`);
    throw new Error('Failed to save file');
  }
};
