const express = require('express');
const { getHotelReviews, addReview } = require('../controllers/reviews');

const { protect, authorize } = require('../middleware/auth');

//Mounted at /api/v1/hotels/:hotelId/reviews
const router = express.Router({ mergeParams: true });

router.route('/').get(getHotelReviews);

//Mounted at /api/v1/bookings/:bookingId/reviews
const bookingReviewRouter = express.Router({ mergeParams: true });

bookingReviewRouter.route('/').post(protect, authorize('admin', 'user'), addReview);

module.exports = router;
module.exports.bookingReviewRouter = bookingReviewRouter;
