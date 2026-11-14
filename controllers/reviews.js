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

//Reviews are found by id the same way everywhere: invalid or missing id is 404
async function findReview(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Review.findById(id);
}

function reviewNotFound(res) {
  return res.status(404).json({ success: false, message: 'Review not found' });
}

//@desc     Get your own reviews; admin gets all reviews (R3)
//@route    GET /api/v1/reviews
//@access   Private
exports.getReviews = async (req, res, next) => {
  try {
    //Users only ever see their own reviews (NFR2); admins see all
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };

    const reviews = await Review.find(filter)
      .populate({ path: 'hotel', select: 'name' })
      .sort({ createdAt: -1, _id: -1 });

    return res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    return next(error);
  }
};

//@desc     Get one review (R4)
//@route    GET /api/v1/reviews/:id
//@access   Public
exports.getReview = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return reviewNotFound(res);

    //Public, so only the reviewer's name is shown, as in the hotel review list
    const review = await Review.findById(req.params.id)
      .populate({ path: 'user', select: 'name' })
      .populate({ path: 'hotel', select: 'name' });

    if (!review) return reviewNotFound(res);

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return next(error);
  }
};

//@desc     Edit the rating and comment of your own review (R3)
//@route    PUT /api/v1/reviews/:id
//@access   Private (review owner only, admin included)
exports.updateReview = async (req, res, next) => {
  try {
    const review = await findReview(req.params.id);

    if (!review) return reviewNotFound(res);

    //R3: only the person who wrote the review can edit it, admins included
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews',
      });
    }

    //Only rating and comment can change; user, hotel and booking stay
    const { rating, comment } = req.body || {};

    if (
      rating !== undefined &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number between 1 and 5',
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    //save() runs the model validators and the post('save') hook that
    //recalculates the hotel's averageRating and reviewCount
    await review.save();

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return res.status(400).json({ success: false, message });
    }
    return next(error);
  }
};

//@desc     Delete your own review (R3)
//@route    DELETE /api/v1/reviews/:id
//@access   Private (review owner)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await findReview(req.params.id);

    if (!review) return reviewNotFound(res);

    //R3: the owner deletes their own review (admin delete of any review is R5, card B5)
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
      });
    }

    //Document deleteOne runs the hook that recalculates the hotel's average
    await review.deleteOne();

    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return next(error);
  }
};
