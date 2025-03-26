
import Transaction from '../db/models/Transaction.js';
import { UsersCollection } from '../db/models/user.js';

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
  //дата у форм "YYYY-MM-DD"
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999); 
  const transactions = await Transaction.find({
    userId,
    date: {
      $gte: startOfDay, 
      $lte: endOfDay,   
    },
  });
  res.status(200).json(transactions); 
};

// Видалити транзакцію
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

  // Оновлюємо бюджет користувача після видалення
  const transactions = await Transaction.find({ userId });
  const newBudget = transactions.reduce((total, tx) => total + tx.amount, 0);

  await UsersCollection.findByIdAndUpdate(userId, { budget: newBudget });

  res.status(200).json({ message: 'Transaction deleted' });
};