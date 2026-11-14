//Base test data (owned by Person A). Runs first.
//Returned values are available in Postman collections as {{name}}.

exports.seed = async (mongoose) => {
  const User = mongoose.model('User');
  const Hotel = mongoose.model('Hotel');
  const Booking = mongoose.model('Booking');

  const admin = await User.create({
    name: 'Test Admin',
    tel: '0800000000',
    email: 'admin@test.com',
    password: 'admin1234',
    role: 'admin',
  });
  const user1 = await User.create({
    name: 'Test User One',
    tel: '0811111111',
    email: 'user1@test.com',
    password: 'user11234',
  });
  const user2 = await User.create({
    name: 'Test User Two',
    tel: '0822222222',
    email: 'user2@test.com',
    password: 'user21234',
  });

  const [hotel1, hotel2] = await Hotel.create([
    {
      name: 'Taco Hotel Bangkok',
      address: '1 Rama IV Road',
      district: 'Pathum Wan',
      province: 'Bangkok',
      postalcode: '10330',
      tel: '021234567',
      region: 'Central',
    },
    {
      name: 'Cat Resort Chiang Mai',
      address: '99 Nimman Road',
      district: 'Mueang',
      province: 'Chiang Mai',
      postalcode: '50200',
      tel: '053123456',
      region: 'North',
    },
  ]);

  //Dates relative to now: one booking not yet checked out, two already checked out
  const day = 24 * 60 * 60 * 1000;
  const inDays = (n) => new Date(Date.now() + n * day);
  const [user1Future, user1Past, user2Booking] = await Booking.create([
    { user: user1.id, hotel: hotel1.id, checkInDate: inDays(10), checkOutDate: inDays(12) },
    { user: user1.id, hotel: hotel1.id, checkInDate: inDays(-12), checkOutDate: inDays(-10) },
    { user: user2.id, hotel: hotel2.id, checkInDate: inDays(-6), checkOutDate: inDays(-4) },
  ]);

  return {
    adminEmail: admin.email,
    adminPassword: 'admin1234',
    adminId: admin.id,
    user1Email: user1.email,
    user1Password: 'user11234',
    user1Id: user1.id,
    user2Email: user2.email,
    user2Password: 'user21234',
    user2Id: user2.id,
    hotel1Id: hotel1.id,
    hotel2Id: hotel2.id,
    user1FutureBookingId: user1Future.id,
    user1PastBookingId: user1Past.id,
    user2BookingId: user2Booking.id,
  };
};
