const errorHandler = (err, _, res, __) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';

  const data = err.errors || err.data || null;

  res.status(status).json({
    status,
    message,
    data,
  });
};

export default errorHandler;
