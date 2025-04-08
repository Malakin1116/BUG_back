// Backend: routes/transactions.js
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  addTransactionController,
  getTransactionsTodayController,
  getTransactionsForWeekController,
  getTransactionsForMonthController,
  deleteTransactionController,
  getTransactionsForDaysMonthController,
  getTransactionsForDaysWeekController,
  getAllTransactionsController,
  deleteAllTransactionsController, // Додаємо новий контролер
} from '../controllers/transactions.js';

const transactionsRouter = Router();

transactionsRouter.post('/', authenticate, ctrlWrapper(addTransactionController));
transactionsRouter.get('/today', authenticate, ctrlWrapper(getTransactionsTodayController));
transactionsRouter.get('/week', authenticate, ctrlWrapper(getTransactionsForWeekController));
transactionsRouter.get('/month', authenticate, ctrlWrapper(getTransactionsForMonthController));
transactionsRouter.delete('/:id', authenticate, ctrlWrapper(deleteTransactionController));
transactionsRouter.delete('/', authenticate, ctrlWrapper(deleteAllTransactionsController)); // Новий маршрут для видалення всіх транзакцій
transactionsRouter.get('/daysWeek', authenticate, ctrlWrapper(getTransactionsForDaysWeekController));
transactionsRouter.get('/daysMonth', authenticate, ctrlWrapper(getTransactionsForDaysMonthController));
transactionsRouter.get('/all', authenticate, ctrlWrapper(getAllTransactionsController));

transactionsRouter.get('/ping', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

export default transactionsRouter;