const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

//An id that is not a valid ObjectId cannot match anything: 404, not 500
const notFound = (res, id) =>
  res.status(404).json({ success: false, message: `Not found: ${id}` });

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@access   Private
exports.getBookings = async (req, res, next) => {
  //Users see only their own bookings, admins see all; a hotel id narrows the list
  const filter = {};
  if (req.user.role !== 'admin') filter.user = req.user.id;
  if (req.params.hotelId) filter.hotel = req.params.hotelId;

  const query = Booking.find(filter).populate({
    path: 'hotel',
    select: 'name address tel',
  });

  try {
    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    if (error.name === 'CastError') return notFound(res, error.value);
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'Cannot find Booking' });
  }
};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'hotel',
      select: 'name address tel',
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this booking`,
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error.name === 'CastError') return notFound(res, error.value);
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'Cannot find Booking' });
  }
};

//@desc     Add booking
//@route    POST /api/v1/hotels/:hotelId/bookings
//@access   Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.hotel = req.params.hotelId;

    const hotel = await Hotel.findById(req.params.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.hotelId}`,
      });
    }

    //Add user Id to req.body
    req.body.user = req.user.id;

    const booking = await Booking.create(req.body);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error.name === 'CastError') return notFound(res, error.value);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'Cannot create Booking' });
  }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      });
    }

    //Dates only; save() so the model's date rules see both dates
    const { checkInDate, checkOutDate } = req.body;
    if (checkInDate !== undefined) booking.checkInDate = checkInDate;
    if (checkOutDate !== undefined) booking.checkOutDate = checkOutDate;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error.name === 'CastError') return notFound(res, error.value);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'Cannot update Booking' });
  }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') return notFound(res, error.value);
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'Cannot delete Booking' });
  }
};
