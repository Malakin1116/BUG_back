import createHttpError from 'http-errors';

export const validateBody = (schema) => async (req, _res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err) {
    console.log(err);
    const error = createHttpError(400, 'Bad Request', {
      errors: err.details.map((detail) => detail.message).join(', '),
    });
    next(error);
  }
};
