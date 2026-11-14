const express = require('express');
const {
  getHotelReviews,
  addReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews');

const { protect, authorize } = require('../middleware/auth');

//Mounted at /api/v1/hotels/:hotelId/reviews
const router = express.Router({ mergeParams: true });

router.route('/').get(getHotelReviews);

//Mounted at /api/v1/bookings/:bookingId/reviews
const bookingReviewRouter = express.Router({ mergeParams: true });

bookingReviewRouter.route('/').post(protect, authorize('admin', 'user'), addReview);

//Mounted at /api/v1/reviews
const reviewRouter = express.Router();

reviewRouter.route('/').get(protect, authorize('admin', 'user'), getReviews);

reviewRouter
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('admin', 'user'), updateReview)
  .delete(protect, authorize('admin', 'user'), deleteReview);

module.exports = router;
module.exports.bookingReviewRouter = bookingReviewRouter;
module.exports.reviewRouter = reviewRouter;
