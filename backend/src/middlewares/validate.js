const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/apiResponse');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, 'Validation failed', errors.array()));
  }
  next();
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { validate, asyncHandler };
