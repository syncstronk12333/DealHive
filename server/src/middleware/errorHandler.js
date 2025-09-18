const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.message);

  res.status(error.statusCode || 500).json({
    error: 'Internal Server Error',
    message: error.message
  });
};

module.exports = { errorHandler };
