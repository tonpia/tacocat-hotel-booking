const mongoose = require('mongoose');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_NIGHTS = 3;

const BookingSchema = new mongoose.Schema(
  {
    checkInDate: {
      type: Date,
      required: [true, 'Please add a check-in date'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Please add a check-out date'],
      validate: [
        {
          validator: function (value) {
            if (!this.checkInDate || !value) return true;
            return value > this.checkInDate;
          },
          message: 'Check-out date must be after check-in date',
        },
        {
          validator: function (value) {
            if (!this.checkInDate || !value || value <= this.checkInDate) {
              return true;
            }
            const nights = Math.round((value - this.checkInDate) / DAY_MS);
            return nights >= 1 && nights <= MAX_NIGHTS;
          },
          message: `A booking must be 1 to ${MAX_NIGHTS} nights`,
        },
      ],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Whole days between check-in and check-out
BookingSchema.virtual('nights').get(function () {
  if (!this.checkInDate || !this.checkOutDate) return undefined;
  return Math.round((this.checkOutDate - this.checkInDate) / DAY_MS);
});

module.exports = mongoose.model('Booking', BookingSchema);
