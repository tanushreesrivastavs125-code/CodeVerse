/**
 * Generic validation middleware factory.
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
