const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const Hotel = require('./models/Hotel');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

//Demo accounts: log in with these in Postman
const ADMIN = {
  name: 'admin',
  tel: '0800000000',
  email: 'admin@gmail.com',
  password: '12345678',
  role: 'admin',
};
const DEMO_USERS = [
  {
    name: 'Demo User One',
    tel: '0811111111',
    email: 'user1@gmail.com',
    password: '12345678',
  },
  {
    name: 'Demo User Two',
    tel: '0822222222',
    email: 'user2@gmail.com',
    password: '12345678',
  },
];

//Split one CSV line, keeping commas that sit inside double quotes
function splitCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value);

  return values;
}

//Read hotel.csv into hotel documents
function readHotels() {
  const csv = fs
    .readFileSync(path.join(__dirname, '_data', 'hotel.csv'), 'utf8')
    .replace(/^﻿/, '');
  const [header, ...lines] = csv.split(/\r?\n/).filter((line) => line.trim());
  const fields = splitCsvLine(header);

  return lines.map((line) => {
    const values = splitCsvLine(line);
    const hotel = {};
    fields.forEach((field, index) => {
      hotel[field] = values[index];
    });
    //Drop the running number column, it is not part of the model
    delete hotel[fields[0]];
    return hotel;
  });
}

async function deleteData() {
  await Review.deleteMany();
  await Booking.deleteMany();
  await Hotel.deleteMany();
  await User.deleteMany({
    email: { $in: [ADMIN.email, ...DEMO_USERS.map((user) => user.email)] },
  });
  console.log('Data destroyed.');
}

//Dates are relative to today so the "already checked out" bookings stay in the
//past however long after seeding the demo runs
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days) => new Date(Date.now() + days * DAY);

async function importData() {
  const hotels = await Hotel.create(readHotels());
  await User.create(ADMIN);
  const [user1, user2] = await User.create(DEMO_USERS);

  const hotelA = hotels[0]._id;
  const hotelB = hotels[1]._id;
  const hotelC = hotels[2]._id;

  //[user, hotel, check-in in days from today, check-out in days from today]
  //Negative check-out: stay is over, so the guest can review it (R1).
  //Positive check-out: stay is not over yet, so reviewing it must fail.
  const bookings = [
    [user1, hotelA, -12, -10],
    [user1, hotelB, -8, -5],
    [user1, hotelC, 10, 12],
    [user2, hotelA, -6, -4],
    [user2, hotelB, 5, 7],
  ];
  await Booking.create(
    bookings.map(([user, hotel, checkIn, checkOut]) => ({
      user: user._id,
      hotel,
      checkInDate: daysFromNow(checkIn),
      checkOutDate: daysFromNow(checkOut),
    })),
  );
  console.log('Data imported.');
  console.log(`Admin ${ADMIN.email}, users ${DEMO_USERS.map((u) => u.email).join(', ')}; password 12345678.`);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  if (process.argv[2] === '-i') {
    await deleteData();
    await importData();
  } else if (process.argv[2] === '-d') {
    await deleteData();
  } else {
    console.log('Usage: node seeder.js -i (reset and import) | -d (delete)');
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
