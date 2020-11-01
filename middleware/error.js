const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  //Log to console for dev
  console.log(err.stack);

  //Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  //Duplicate Key
  if (err.name === 'MongoError') {
    const message = 'Duplicate field value entered';

    error = new ErrorResponse(message, 400);
  }

  //Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((err) => {
      return err.message;
    });
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
