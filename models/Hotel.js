const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a hotel name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    postalcode: {
      type: String,
      trim: true,
    },
    tel: {
      type: String,
      required: [true, 'Please add a telephone number'],
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    //Kept up to date by Review.calcAverageRating after every review change
    averageRating: {
      type: Number,
      default: null,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Reverse populate with virtuals
hotelSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'hotel',
  justOne: false,
});

hotelSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'hotel',
  justOne: false,
});

//Cascade delete the hotel's reviews and bookings when a hotel is deleted.
//deleteMany skips the per-document hooks, so reviews are removed here directly
//instead of through a booking's own cascade.
hotelSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function () {
    await this.model('Review').deleteMany({ hotel: this._id });
    await this.model('Booking').deleteMany({ hotel: this._id });
  },
);

module.exports = mongoose.model('Hotel', hotelSchema);
