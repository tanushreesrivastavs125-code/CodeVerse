/**
 * Generic validation middleware factory for request bodies.
 * Executes the provided validator function against req.body.
 * Attaches sanitized/normalized data back to req.body.
 *
 * @param {(body: unknown) => unknown} validatorFn - Function that validates and normalizes payload
 * @returns {import('express').RequestHandler}
 */
export function validate(validatorFn) {
  return (req, _res, next) => {
    try {
      req.body = validatorFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Generic validation middleware factory for request query parameters.
 * Executes the provided validator function against req.query.
 * Attaches sanitized/normalized query data back to req.query.
 *
 * @param {(query: unknown) => unknown} validatorFn - Function that validates and normalizes query
 * @returns {import('express').RequestHandler}
 */
export function validateQuery(validatorFn) {
  return (req, _res, next) => {
    try {
      req.query = validatorFn(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}
