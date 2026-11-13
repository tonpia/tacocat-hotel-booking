//Base test data (owned by Person A). Runs first.
//Returned values are available in Postman collections as {{name}}.

exports.seed = async (mongoose) => {
  const User = mongoose.model('User');
  const Hospital = mongoose.model('Hospital');

  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'admin1234',
    role: 'admin',
  });
  const user1 = await User.create({
    name: 'Test User One',
    email: 'user1@test.com',
    password: 'user11234',
  });
  const user2 = await User.create({
    name: 'Test User Two',
    email: 'user2@test.com',
    password: 'user21234',
  });

  const [hotel1, hotel2] = await Hospital.create([
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
  };
};
