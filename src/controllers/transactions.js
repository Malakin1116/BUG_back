import Transaction from '../db/models/Transaction.js';
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import {
  getTransactionsForToday,
  getTransactionsForWeek,
  getTransactionsForMonth,
  getTransactionsForDaysMonth,
  getTransactionsForDaysWeek,

} from '../services/transactions.js'; // Додаємо імпорт

export const addTransactionController = async (req, res) => {
  const { amount, category, description, type, date } = req.body;
  const userId = req.user._id;
  const transaction = new Transaction({
    userId,
    amount,
    category,
    description,
    type,
    date,
  });
  await transaction.save();
  const transactions = await Transaction.find({ userId });
  const newBudget = transactions.reduce((total, tx) => total + tx.amount, 0);
  await UsersCollection.findByIdAndUpdate(userId, { budget: newBudget });
  res.status(201).json({ message: 'Transaction added', transaction });
};

export const getTransactionsTodayController = async (req, res) => {
  const userId = req.user._id;
  const dateStr = req.query.date;
  const transactions = await getTransactionsForToday(userId, dateStr);
  if (!transactions || transactions.length === 0) {
    return res.status(200).json({
      message: 'No transactions found for today',
      data: [],
    });
  }
  res.status(200).json({
    message: 'Transactions for today retrieved successfully',
    data: transactions,
  });
};

export const getTransactionsForWeekController = async (req, res) => {
  const userId = req.user._id;
  const { year, week } = req.query;
  if (!year || !week) {
    throw createHttpError(400, 'Year and week are required');
  }
  if (typeof year !== 'string' || typeof week !== 'string') {
    throw createHttpError(400, 'Year and week must be strings');
  }
  const parsedYear = parseInt(year, 10);
  const parsedWeek = parseInt(week, 10);
  if (isNaN(parsedYear) || isNaN(parsedWeek) || parsedWeek < 1 || parsedWeek > 53) {
    throw createHttpError(400, 'Invalid year or week');
  }
  const transactions = await getTransactionsForWeek(userId, parsedYear, parsedWeek);
  if (!transactions || transactions.length === 0) {
    return res.status(200).json({
      message: `No transactions found for requested week ${parsedYear}-W${parsedWeek}`,
      data: [],
    });
  }
  res.status(200).json({
    message: `Transactions for requested week ${parsedYear}-W${parsedWeek} retrieved successfully`,
    data: transactions,
  });
};

export const getTransactionsForMonthController = async (req, res) => {
  const userId = req.user._id;
  const { year, month } = req.query;

  if (!year || !month) {
    throw createHttpError(400, 'Year and month are required');
  }

  if (typeof year !== 'string' || typeof month !== 'string') {
    throw createHttpError(400, 'Year and month must be strings');
  }

  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10);

  if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw createHttpError(400, 'Invalid year or month');
  }

  const monthTransactions = await getTransactionsForMonth(userId, parsedYear, parsedMonth);

  if (!monthTransactions || monthTransactions.length === 0) {
    return res.status(200).json({
      message: `No transactions found for requested month ${parsedYear}-${parsedMonth}`,
      data: [],
    });
  }

  res.status(200).json({
    message: `Transactions for requested month ${parsedYear}-${parsedMonth} retrieved successfully`,
    data: monthTransactions,
  });
};

export const deleteTransactionController = async (req, res) => {
  const userId = req.user._id;
  const transactionId = req.params.id;
  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    userId,
  });
  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  const transactions = await Transaction.find({ userId });
  const newBudget = transactions.reduce((total, tx) => total + tx.amount, 0);
  await UsersCollection.findByIdAndUpdate(userId, { budget: newBudget });
  res.status(200).json({ message: 'Transaction deleted' });
};

export const getTransactionsForDaysWeekController = async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw createHttpError(400, 'startDate and endDate are required');
  }
  const transactions = await getTransactionsForDaysWeek(userId, startDate, endDate);
  if (!transactions || transactions.length === 0) {
    return res.status(200).json({
      message: `No transactions found for period ${startDate} to ${endDate}`,
      data: [],
    });
  }
  res.status(200).json({
    message: `Transactions for period ${startDate} to ${endDate} retrieved successfully`,
    data: transactions,
  });
};

export const getTransactionsForDaysMonthController = async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw createHttpError(400, 'startDate and endDate are required');
  }
  const transactions = await getTransactionsForDaysMonth(userId, startDate, endDate);
  if (!transactions || transactions.length === 0) {
    return res.status(200).json({
      message: `No transactions found for period ${startDate} to ${endDate}`,
      data: [],
    });
  }
  res.status(200).json({
    message: `Transactions for period ${startDate} to ${endDate} retrieved successfully`,
    data: transactions,
  });
};