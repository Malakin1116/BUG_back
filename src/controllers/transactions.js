import Transaction from '../db/models/Transaction.js';
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import {
  getTransactionsForToday,
  getTransactionsForWeek,
  getTransactionsForMonth,
  getTransactionsForDaysMonth,
  getTransactionsForDaysWeek,
  getAllTransactions,
} from '../services/transactions.js'; 

export const addTransactionController = async (req, res) => {
  const { amount, category, description, type, date } = req.body;
  const userId = req.user._id;
  const transactionDate = new Date(date).setUTCHours(0, 0, 0, 0);
  const newTransaction = { amount, category, description, type };

  const user = await UsersCollection.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let userTransactions = await Transaction.findOne({ userId });
  let savedTransaction;

  if (userTransactions) {
    const dayEntry = userTransactions.transactionsByDay.find(
      (entry) => new Date(entry.date).setUTCHours(0, 0, 0, 0) === transactionDate
    );

    if (dayEntry) {
      // Додаємо транзакцію до існуючого дня
      dayEntry.transactions.push(newTransaction);
    } else {
      // Додаємо новий день із транзакцією
      userTransactions.transactionsByDay.push({ date, transactions: [newTransaction] });
    }

    await userTransactions.save();

    // Оновлюємо userTransactions після збереження
    userTransactions = await Transaction.findOne({ userId });

    // Знаходимо щойно додану транзакцію
    const updatedDayEntry = userTransactions.transactionsByDay.find(
      (entry) => new Date(entry.date).setUTCHours(0, 0, 0, 0) === transactionDate
    );
    savedTransaction = updatedDayEntry.transactions[updatedDayEntry.transactions.length - 1];
  } else {
    // Створюємо нову транзакцію для користувача
    userTransactions = await Transaction.create({
      userId,
      transactionsByDay: [{ date, transactions: [newTransaction] }],
    });

    const createdDayEntry = userTransactions.transactionsByDay.find(
      (entry) => new Date(entry.date).setUTCHours(0, 0, 0, 0) === transactionDate
    );
    savedTransaction = createdDayEntry.transactions[0];
  }

  // Формуємо повний об’єкт транзакції для відповіді
  const transactionResponse = {
    _id: savedTransaction._id.toString(),
    amount: savedTransaction.amount,
    category: savedTransaction.category,
    description: savedTransaction.description,
    type: savedTransaction.type,
    date: new Date(date).toISOString(),
  };

  res.status(201).json({ message: 'Transaction added', transaction: transactionResponse });
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

  const transactions = await Transaction.findOne({ userId });
  if (!transactions) {
    return res.status(404).json({ message: 'Transactions not found' });
  }

  let deleted = false;
  for (const day of transactions.transactionsByDay) {
    const txIndex = day.transactions.findIndex((tx) => tx._id.toString() === transactionId);
    if (txIndex !== -1) {
      day.transactions.splice(txIndex, 1);
      deleted = true;
      if (day.transactions.length === 0) {
        transactions.transactionsByDay = transactions.transactionsByDay.filter(
          (d) => d.date !== day.date
        );
      }
      break;
    }
  }
  if (!deleted) {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  await transactions.save();
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

export const getAllTransactionsController = async (req, res) => {
  const userId = req.user._id;
  const transactions = await getAllTransactions(userId);

  if (!transactions || transactions.length === 0) {
    return res.status(200).json({
      message: 'No transactions found for this user',
      data: [],
    });
  }

  res.status(200).json({
    message: 'All transactions retrieved successfully',
    data: transactions,
  });
};

export const deleteAllTransactionsController = async (req, res) => {
  const userId = req.user._id;
  const userTransactions = await Transaction.findOne({ userId });
  if (!userTransactions) {
    return res.status(404).json({ message: 'Transactions not found' });
  }
  await Transaction.deleteOne({ userId });
  res.status(200).json({ message: 'All transactions deleted' });
};