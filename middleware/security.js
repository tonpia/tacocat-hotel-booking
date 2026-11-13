const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

//Strip keys that start with $ or contain . from body, params and query.
//Sanitized in place because req.query is read-only in Express 5.
exports.sanitizeNoSql = (req, res, next) => {
  ['body', 'params', 'query'].forEach((key) => {
    if (req[key] && typeof req[key] === 'object') {
      mongoSanitize.sanitize(req[key]);
    }
  });
  next();
};

const cleanXss = (value) => {
  if (typeof value === 'string') {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(cleanXss);
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      value[key] = cleanXss(value[key]);
    });
  }
  return value;
};

//Escape HTML/script tags in every string of the request body
exports.xssClean = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    cleanXss(req.body);
  }
  next();
};
