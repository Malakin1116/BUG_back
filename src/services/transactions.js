import Transaction from '../db/models/Transaction.js';
import createHttpError from 'http-errors';

export const getTransactionsForToday = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  return await Transaction.find({
    userId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });
};

export const getTransactionsForWeek = async (userId, year, week) => {
  if (week < 1 || week > 53) {
    throw createHttpError(400, 'Invalid week number');
  }
  const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const firstDayOfYear = startOfYear.getUTCDay();
  const daysToFirstMonday = firstDayOfYear === 0 ? 1 : 8 - firstDayOfYear;
  const startOfFirstWeek = new Date(startOfYear);
  startOfFirstWeek.setUTCDate(startOfYear.getUTCDate() + daysToFirstMonday - 7);
  const startOfWeek = new Date(startOfFirstWeek);
  startOfWeek.setUTCDate(startOfFirstWeek.getUTCDate() + (week - 1) * 7);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  const startWeekISO = startOfWeek.toISOString();
  const endWeekISO = endOfWeek.toISOString();
  return await Transaction.find({
    userId,
    date: { $gte: startWeekISO, $lte: endWeekISO },
  });
};

export const getTransactionsForMonth = async (userId, year, month) => {
  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10);
  if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw createHttpError(400, 'Invalid year or month');
  }
  const startMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0)).toISOString();
  const endMonth = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59)).toISOString();
  return await Transaction.find({
    userId,
    date: { $gte: startMonth, $lte: endMonth },
  });
};