import Joi from 'joi';

export const createWaterRecordSchema = Joi.object({
  date: Joi.string()
    .required()
    .pattern(/^(\d{4})-(\d{2})-(\d{2})$/)
    .messages({
      'any.required': 'Date is required',
      'date.base': 'Date must be a string',
      'string.pattern.base': 'Date must be in the format yyyy-mm-dd',
    }),
  time: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/)
    .required()
    .messages({
      'any.required': 'Time is required',
      'string.pattern.base': 'Time must be in the format hh:mm',
    }),
  volume: Joi.number()
    .integer()
    .min(50)
    .max(5000)
    .positive()
    .required()
    .messages({
      'any.required': 'Volume is required',
      'number.base': 'Volume must be a number',
      'number.positive': 'Volume must be a positive number',
    }),
});
