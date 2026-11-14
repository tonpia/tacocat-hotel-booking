//Review test data (owned by Person B). Runs after 10-base.js.
//Returned values are available in Postman collections as {{name}}.
//
//There is no endpoint to create reviews yet (B2), so this fixture exercises
//the Review model directly: it records which invalid reviews the model rejects
//and the hotel's averageRating/reviewCount after create, edit and delete, and
//the 40-reviews collection asserts on those values, on GET /hotels/:id and on
//GET /hotels/:hotelId/reviews (B4).
//These model-level reviews point at placeholder booking ids.
//
//B2 (POST /bookings/:bookingId/reviews) uses real bookings on a separate hotel,
//reviewHotel, which starts with no reviews:
//  user1PastBookingId     user1, checked out 2 days ago: reviewable
//  user1FutureBookingId   user1, check-out in 4 days: too early
//  user1CheckOutLaterTodayBookingId  user1, check-out in 1 hour: too early
//  user2PastBookingId     user2, checked out 2 days ago: reviewable by user2 only
//
//Left in the database for the collection:
//  hotel1: no reviews
//  hotel2: ratings 4 and 1 (user1), average 2.5 of 2
//  hotel3 (this fixture): rating 5 (user2), so hotel2's list must not show it
//  reviewHotel (this fixture): no reviews, no ratings until the collection adds them

require('../../models/Review');
require('../../models/Booking');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function outcome(promise) {
  try {
    await promise;
    return 'accepted';
  } catch (error) {
    if (error.code === 11000) return 'DuplicateKey';
    return error.name;
  }
}

async function hotelStats(Hotel, hotelId) {
  const hotel = await Hotel.findById(hotelId).lean();
  return JSON.stringify({
    averageRating: hotel.averageRating,
    reviewCount: hotel.reviewCount,
  });
}

exports.seed = async (mongoose, base) => {
  const Review = mongoose.model('Review');
  const Hotel = mongoose.model('Hotel');
  const { ObjectId } = mongoose.Types;

  //Make sure the unique index on booking exists before testing it
  await Review.init();

  const reviewFor = (rating, extra = {}) => ({
    user: base.user1Id,
    hotel: base.hotel2Id,
    booking: new ObjectId(),
    rating,
    comment: 'Fixture review',
    ...extra,
  });

  //Average and count after create, edit and delete (hotel2)
  const [, five, two] = [
    await Review.create(reviewFor(4)),
    await Review.create(reviewFor(5, { user: base.user2Id })),
    await Review.create(reviewFor(2)),
  ];
  const statsAfterCreate = await hotelStats(Hotel, base.hotel2Id);

  two.rating = 3;
  await two.save();
  const statsAfterEdit = await hotelStats(Hotel, base.hotel2Id);

  await Review.findByIdAndUpdate(two.id, { rating: 1 }, { runValidators: true });
  const statsAfterQueryEdit = await hotelStats(Hotel, base.hotel2Id);

  await five.deleteOne();
  const statsAfterDelete = await hotelStats(Hotel, base.hotel2Id);

  //Model rules: integer rating 1 to 5, comment max 1000, one review per booking
  const rejects = {
    rating0: await outcome(Review.create(reviewFor(0))),
    rating6: await outcome(Review.create(reviewFor(6))),
    rating3point5: await outcome(Review.create(reviewFor(3.5))),
    ratingMissing: await outcome(Review.create(reviewFor(undefined))),
    comment1001: await outcome(
      Review.create(reviewFor(4, { comment: 'a'.repeat(1001) })),
    ),
    sameBooking: await outcome(
      Review.create(reviewFor(4, { booking: two.booking })),
    ),
  };
  const statsAfterRejects = await hotelStats(Hotel, base.hotel2Id);

  //A review on another hotel, which must not appear in hotel2's reviews
  const hotel3 = await Hotel.create({
    name: 'Review Fixture Hotel',
    address: '3 Fixture Road',
    tel: '020000003',
  });
  await Review.create({
    user: base.user2Id,
    hotel: hotel3.id,
    booking: new ObjectId(),
    rating: 5,
    comment: 'Fixture review on another hotel',
  });

  //Real bookings for POST /bookings/:bookingId/reviews (B2)
  const Booking = mongoose.model('Booking');
  const reviewHotel = await Hotel.create({
    name: 'Review Booking Hotel',
    address: '4 Fixture Road',
    tel: '020000004',
  });
  const now = Date.now();
  const stay = (userId, checkOutFromNow) => ({
    user: userId,
    hotel: reviewHotel.id,
    checkInDate: new Date(now + checkOutFromNow - 2 * DAY),
    checkOutDate: new Date(now + checkOutFromNow),
  });
  const [user1Past, user1Future, user1LaterToday, user2Past] =
    await Booking.create([
      stay(base.user1Id, -2 * DAY),
      stay(base.user1Id, 4 * DAY),
      stay(base.user1Id, HOUR),
      stay(base.user2Id, -2 * DAY),
    ]);

  return {
    reviewModelRejects: JSON.stringify(rejects),
    hotel2StatsAfterCreate: statsAfterCreate,
    hotel2StatsAfterEdit: statsAfterEdit,
    hotel2StatsAfterQueryEdit: statsAfterQueryEdit,
    hotel2StatsAfterDelete: statsAfterDelete,
    hotel2StatsAfterRejects: statsAfterRejects,
    hotel3Id: hotel3.id,
    reviewHotelId: reviewHotel.id,
    user1PastBookingId: user1Past.id,
    user1FutureBookingId: user1Future.id,
    user1CheckOutLaterTodayBookingId: user1LaterToday.id,
    user2PastBookingId: user2Past.id,
  };
};
