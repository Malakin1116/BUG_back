import Transaction from '../db/models/Transaction.js';

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
  res.status(201).json({ message: 'Transaction added', transaction });
};


export const getTransactionsByDayController = async (req, res) => {
  const userId = req.user._id;
  const { date } = req.query; 
  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
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
  res.status(200).json({ message: 'Transaction deleted' });
};