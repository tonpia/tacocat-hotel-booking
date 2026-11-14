const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
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
    //R2: one review per booking (unique index below)
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating between 1 and 5'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment can not be more than 1000 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ReviewSchema.index({ booking: 1 }, { unique: true });

//R4: recalculate the hotel's average rating (1 decimal, null when no reviews)
//and review count from its reviews
ReviewSchema.statics.calcAverageRating = async function (hotelId) {
  const [stats] = await this.aggregate([
    { $match: { hotel: new mongoose.Types.ObjectId(String(hotelId)) } },
    {
      $group: {
        _id: '$hotel',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const update = stats
    ? {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        reviewCount: stats.reviewCount,
      }
    : { averageRating: null, reviewCount: 0 };

  await mongoose.model('Hotel').updateOne({ _id: hotelId }, update);
};

//Keep the hotel's average correct after every create, update and delete
ReviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.hotel);
});

ReviewSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function () {
    await this.constructor.calcAverageRating(this.hotel);
  },
);

ReviewSchema.post(['findOneAndUpdate', 'findOneAndDelete'], async function (doc) {
  if (doc) {
    await mongoose.model('Review').calcAverageRating(doc.hotel);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
