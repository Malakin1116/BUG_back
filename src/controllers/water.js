import createHttpError from 'http-errors';
import {
  addWaterRecord,
  getWaterToday,
  updateWaterRecord,
  deleteWaterRecord,
  getWaterForMonth,
} from '../services/water.js';

export const addWaterRecordController = async (req, res) => {
  const userId = req.user._id;
  const { date, time, volume } = req.body;

  const record = await addWaterRecord({ userId, date, time, volume });

  res.status(201).json({
    status: 201,
    message: 'Water consumption record added successfully!',
    data: record,
  });
};

export const updateWaterRecordController = async (req, res) => {
  const userId = req.user._id;
  const { id: recordId } = req.params;
  const updateData = req.body;

  if (!updateData.date && !updateData.volume && !updateData.time) {
    throw createHttpError(400, 'At least one field is required for update');
  }

  const updatedRecord = await updateWaterRecord(userId, recordId, updateData);

  res.json({
    status: 200,
    message: 'Successfully updated water record!',
    data: updatedRecord,
  });
};

export const getWaterTodayController = async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    throw createHttpError(401, 'Unauthorized: User not found');
  }
  const waterData = await getWaterToday(userId);

  if (!waterData || waterData.length === 0) {
    return res.json({
      status: 200,
      message: 'No water consumption data found for today',
      data: [],
    });
  }

  res.json({
    status: 200,
    message: 'Water consumption data retrieved successfully',
    data: waterData,
  });
};

export const getWaterForMonthController = async (req, res) => {
  const userId = req.user._id;
  const { year, month } = req.query;

  //Convert year and month to number
  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10);

  // Checking if values are correct
  if (
    isNaN(parsedYear) ||
    isNaN(parsedMonth) ||
    parsedMonth < 1 ||
    parsedMonth > 12
  ) {
    throw createHttpError(400, 'Invalid year or month');
  }

  const monthWaterData = await getWaterForMonth(
    userId,
    parsedYear,
    parsedMonth,
  );

  if (!monthWaterData || monthWaterData.length === 0) {
    return res.json({
      status: 200,
      message: `No water consumption data found for requested month ${parsedYear}-${parsedMonth}`,
      data: [],
    });
  }

  res.json({
    status: 200,
    message: `Water consumption data for requested month ${parsedYear}-${parsedMonth} retrieved successfully`,
    data: monthWaterData,
  });
};

export const deleteWaterRecordController = async (req, res) => {
  const userId = req.user._id;
  const { id: recordId } = req.params;

  const deletedRecord = await deleteWaterRecord(userId, recordId);

  if (!deletedRecord) {
    throw createHttpError(404, 'Water consumption record not found');
  }

  res.status(204).send();
};
