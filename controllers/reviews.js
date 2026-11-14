const mongoose = require('mongoose');
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

//@desc     Review the hotel of one of your bookings after check-out (R1, R2)
//@route    POST /api/v1/bookings/:bookingId/reviews
//@access   Private (booking owner only)
exports.addReview = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res
        .status(404)
        .json({ success: false, message: 'Booking not found' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: 'Booking not found' });
    }

    //R1: only the person who made the booking can review it (admin included)
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings',
      });
    }

    //R1: only after the booking's check-out date has passed
    const checkOut = booking.checkOutDate
      ? new Date(booking.checkOutDate).getTime()
      : NaN;
    if (!(checkOut < Date.now())) {
      return res.status(400).json({
        success: false,
        message: 'You can review this hotel only after your check-out date',
      });
    }

    //R2: one review per booking (the unique index on Review.booking backs this up)
    if (await Review.exists({ booking: booking._id })) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }

    //Only rating and comment come from the body; the rest comes from the booking
    const { rating, comment } = req.body || {};

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number between 1 and 5',
      });
    }

    const review = await Review.create({
      rating,
      comment,
      booking: booking._id,
      hotel: booking.hotel,
      user: booking.user,
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }
    return next(error);
  }
};

//@desc     Get all reviews of a hotel with its average rating (R4)
//@route    GET /api/v1/hotels/:hotelId/reviews
//@access   Public
exports.getHotelReviews = async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.isValidObjectId(hotelId)) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    //Newest first; only the reviewer's name is shown publicly
    const reviews = await Review.find({ hotel: hotelId })
      .populate({ path: 'user', select: 'name' })
      .sort({ createdAt: -1, _id: -1 });

    //Average of the listed reviews, 1 decimal, null when there are none
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length
      ? Math.round((total / reviews.length) * 10) / 10
      : null;

    return res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews,
    });
  } catch (error) {
    return next(error);
  }
};
