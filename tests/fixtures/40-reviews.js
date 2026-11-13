//Review test data (owned by Person B). Runs after 10-base.js.
//Returned values are available in Postman collections as {{name}}.
//
//B1 has no review endpoints yet, so this fixture exercises the Review model
//directly: it records which invalid reviews the model rejects and the hotel's
//averageRating/reviewCount after create, edit and delete, and the
//40-reviews collection asserts on those values and on GET /hotels/:id.
//Reviews point at placeholder booking ids until B2 adds real bookings with a
//past check-out.

require('../../models/Review');

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

  return {
    reviewModelRejects: JSON.stringify(rejects),
    hotel2StatsAfterCreate: statsAfterCreate,
    hotel2StatsAfterEdit: statsAfterEdit,
    hotel2StatsAfterQueryEdit: statsAfterQueryEdit,
    hotel2StatsAfterDelete: statsAfterDelete,
    hotel2StatsAfterRejects: statsAfterRejects,
  };
};
