import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results from express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: extractedErrors[0].message,
      errors: extractedErrors
    });
  }
  next();
};
