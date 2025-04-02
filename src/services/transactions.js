import Transaction from '../db/models/Transaction.js';

export const getTransactionsForToday = async (userId, dateStr) => {
  const startOfDay = dateStr
    ? new Date(dateStr).setUTCHours(0, 0, 0, 0)
    : new Date().setUTCHours(0, 0, 0, 0);

  const transactions = await Transaction.findOne({ userId });
  if (!transactions) return [];

  const dayData = transactions.transactionsByDay.find(
    (entry) => new Date(entry.date).setUTCHours(0, 0, 0, 0) === startOfDay
  );
  return dayData
    ? dayData.transactions.map((tx) => ({
        ...tx.toObject(),
        date: dayData.date, // Додаємо дату дня
      }))
    : [];
};

export const getTransactionsForWeek = async (userId, year, week) => {
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const firstDayOfYear = startOfYear.getUTCDay();
  const daysToFirstMonday = firstDayOfYear === 0 ? 1 : 8 - firstDayOfYear;
  const startOfFirstWeek = new Date(startOfYear);
  startOfFirstWeek.setUTCDate(startOfYear.getUTCDate() + daysToFirstMonday - 7);
  const startOfWeek = new Date(startOfFirstWeek);
  startOfWeek.setUTCDate(startOfFirstWeek.getUTCDate() + (week - 1) * 7);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

  const transactions = await Transaction.findOne({ userId });
  if (!transactions) return [];

  const filteredDays = transactions.transactionsByDay
    .filter((day) => {
      const dayDate = new Date(day.date);
      return dayDate >= startOfWeek && dayDate <= endOfWeek;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return filteredDays.flatMap((day) =>
    day.transactions.map((tx) => ({
      ...tx.toObject(),
      date: day.date,
    }))
  );
};

export const getTransactionsForMonth = async (userId, year, month) => {
  const startMonth = new Date(Date.UTC(year, month - 1, 1));
  const endMonth = new Date(Date.UTC(year, month, 0));

  const transactions = await Transaction.findOne({ userId });
  if (!transactions) return [];

  const filteredDays = transactions.transactionsByDay
    .filter((day) => {
      const dayDate = new Date(day.date);
      return dayDate >= startMonth && dayDate <= endMonth;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return filteredDays.flatMap((day) =>
    day.transactions.map((tx) => ({
      ...tx.toObject(),
      date: day.date,
    }))
  );
};

export const getTransactionsForDaysWeek = async (userId, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const transactions = await Transaction.findOne({ userId });
  if (!transactions) return [];

  const filteredDays = transactions.transactionsByDay
    .filter((day) => {
      const dayDate = new Date(day.date);
      return dayDate >= start && dayDate <= end;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return filteredDays.flatMap((day) =>
    day.transactions.map((tx) => ({
      ...tx.toObject(),
      date: day.date,
    }))
  );
};

export const getTransactionsForDaysMonth = async (userId, startDate, endDate) => {
  return getTransactionsForDaysWeek(userId, startDate, endDate);
};

export const getAllTransactions = async (userId) => {
  const transactions = await Transaction.findOne({ userId });
  if (!transactions) return [];

  const sortedDays = transactions.transactionsByDay.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return sortedDays.flatMap((day) =>
    day.transactions.map((tx) => ({
      ...tx.toObject(),
      date: day.date,
    }))
  );
};