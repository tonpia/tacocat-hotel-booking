const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a hospital name'],
      trim: true,
    },
    address: {
      type: String,
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
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Reverse populate with virtuals
hospitalSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'hospital',
  justOne: false,
});

//Cascade delete appointments when a hospital is deleted
hospitalSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function () {
    console.log(`Appointments being removed from hospital ${this._id}`);
    await this.model('Appointment').deleteMany({ hospital: this._id });
  },
);

module.exports = mongoose.model('Hospital', hospitalSchema);
