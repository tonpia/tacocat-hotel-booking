const mongoose = require('mongoose');
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');

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
