import Joi from 'joi';

export const updateUserValidationSchema = Joi.object({
  name: Joi.string().min(3).max(12).default('').required().messages({
    'string.base': 'Username should be a string',
    'string.min': 'Username should have at least 3 characters',
    'string.max': 'Username should have at most 12 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required(),
  gender: Joi.string().valid('woman', 'man'),
  weight: Joi.number().min(0),
  dailySportTime: Joi.number().min(0),
  dailyNorm: Joi.number().min(500).max(15000),
});
