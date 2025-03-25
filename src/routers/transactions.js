import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validateBody.js';
import { addTransactionSchema } from '../validation/transaction.js';
import {
  addTransactionController,
  getTransactionsByDayController,
  deleteTransactionController,
} from '../controllers/transactions.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const transactionsRouter = Router();

transactionsRouter.post(
  '/',
  authenticate,
  validateBody(addTransactionSchema),
  ctrlWrapper(addTransactionController),
);

transactionsRouter.get('/today', authenticate, ctrlWrapper(getTransactionsByDayController));

transactionsRouter.delete('/:id', authenticate, ctrlWrapper(deleteTransactionController));

export default transactionsRouter;