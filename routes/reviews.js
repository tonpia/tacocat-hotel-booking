const express = require('express');
const { getHotelReviews } = require('../controllers/reviews');

const router = express.Router({ mergeParams: true });

//Mounted at /api/v1/hotels/:hotelId/reviews
router.route('/').get(getHotelReviews);

module.exports = router;
