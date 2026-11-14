const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const swaggerJsDoc = require('./config/swagger');
const swaggerUI = require('swagger-ui-express');
const { sanitizeNoSql, xssClean } = require('./middleware/security');

const hotelRoutes = require('./routes/hotels');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const { bookingReviewRouter, reviewRouter } = require('./routes/reviews');

dotenv.config({ path: './config/config.env' });

const app = express();

//Parse bracket operators such as province[gt]=... into nested objects
app.set('query parser', 'extended');

app.use(express.json());
app.use(cookieParser());

//Prevent NoSQL injection
app.use(sanitizeNoSql);

//Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xssClean);

//Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 mins
  limit: Number(process.env.RATE_LIMIT_MAX) || 100,
});
app.use(limiter);

//API documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerJsDoc));

app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings/:bookingId/reviews', bookingReviewRouter);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRouter);

app.use((error, req, res, next) => {
  const statusCode = error.name === 'CastError' ? 404 : 500;
  const message =
    statusCode === 404 ? 'Hotel not found' : 'Unable to process request';

  res.status(statusCode).json({ success: false, message });
});

const port = Number(process.env.PORT) || 5000;

async function connectDatabase() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');
}

async function startServer() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  void startServer();
}

module.exports = app;
