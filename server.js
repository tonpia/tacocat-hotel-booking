const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const hospitalRoutes = require('./routes/hospitals');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

dotenv.config({ path: './config/config.env' });

const app = express();

//Parse bracket operators such as province[gt]=... into nested objects
app.set('query parser', 'extended');

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);

app.use((error, req, res, next) => {
  const statusCode = error.name === 'CastError' ? 404 : 500;
  const message =
    statusCode === 404 ? 'Hospital not found' : 'Unable to process request';

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
