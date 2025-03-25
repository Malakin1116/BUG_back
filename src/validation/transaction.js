
import Joi from 'joi';

export const addTransactionSchema = Joi.object({
  amount: Joi.number().required().messages({
    'number.base': 'Amount must be a number',
    'any.required': 'Amount is required',
  }),
  category: Joi.string().trim().required().messages({
    'string.base': 'Category must be a string',
    'string.empty': 'Category cannot be empty',
    'any.required': 'Category is required',
  }),
  description: Joi.string().trim().optional(),
  type: Joi.string().valid('income', 'costs').required().messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be either "income" or "costs"',
    'any.required': 'Type is required',
  }),
  date: Joi.date().required().messages({
    'date.base': 'Date must be a valid date',
    'any.required': 'Date is required',
  }),
});