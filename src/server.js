import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { initMongoDB } from './db/initMongoConnection.js';
import router from './routers/index.js';

import notFoundHandler from './middlewares/notFoundHandler.js';
import errorHandler from './middlewares/errorHandler.js';
import swaggerDocs from './middlewares/swaggerDocs.js';



import { UPLOAD_DIR } from './constants/index.js';

dotenv.config();

export const startServer = async () => {
  const app = express();

  app.use(
    express.json({
      type: ['application/json'],
      limit: '500kb',
    }),
  );

 app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8081',
      'https://bug1116.onrender.com',
      true, // Дозволяємо запити без origin
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

  app.use(cookieParser());

  await initMongoDB();

  app.use('/uploads', express.static(UPLOAD_DIR));
  app.use('/api-docs', swaggerDocs());

  app.use('/', router);

  app.get('/', (_, res) => {
    res.send('Welcome to the server!');
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
