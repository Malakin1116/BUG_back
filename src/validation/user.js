import Joi from 'joi';

export const updateUserValidationSchema = Joi.object({
  name: Joi.string().min(3).max(12).default('').optional().messages({
    'string.base': 'Username must be a string',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must not exceed 12 characters',
  }),
  budget: Joi.number().min(0).default(0).optional().messages({
    'number.min': 'Budget must be at least 0',
  }),
  budgetStartDate: Joi.date().optional().messages({
    'date.base': 'Budget start date must be a valid date',
  }),
});