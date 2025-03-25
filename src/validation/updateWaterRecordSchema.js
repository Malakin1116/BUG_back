import Joi from 'joi';

export const updateWaterRecordSchema = Joi.object({
  date: Joi.string()
    .pattern(/^(\d{4})-(\d{2})-(\d{2})$/)
    .messages({
      'date.base': 'Date must be a string',
      'string.pattern.base': 'Date must be in the format yyyy-mm-dd',
    }),
  time: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/)
    .messages({
      'string.pattern.base': 'Time must be in the format hh:mm',
      'string.base': 'Time must be a string',
    }),
  volume: Joi.number()
    .integer()
    .min(50)
    .max(5000)
    .positive()
    .optional()
    .messages({
      'number.base': 'Volume must be a number',
      'number.positive': 'Volume must be a positive number',
    }),
}).min(1);
