import cors from 'cors';
import pino from 'pino-http';
import express from 'express';

const setupMiddleware = (app) => {
  app.use(cors());

  app.use(pino());

  app.use(express.json());
};

export default setupMiddleware;
