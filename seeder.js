const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const Hotel = require('./models/Hotel');
const User = require('./models/User');
const Booking = require('./models/Booking');

//Fixed id that the test collection expects for this hotel
const APPT_HOTEL_NAME = 'รักษ์สกล';
const APPT_HOTEL_ID = '6ab8cf3ded32aea2b87adb42';

const ADMIN = {
  name: 'admin',
  tel: '0800000000',
  email: 'admin@gmail.com',
  password: '12345678',
  role: 'admin',
};

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
    if (hotel.name === APPT_HOTEL_NAME) {
      hotel._id = APPT_HOTEL_ID;
    }
    return hotel;
  });
}

async function deleteData() {
  await Booking.deleteMany();
  await Hotel.deleteMany();
  await User.deleteOne({ email: ADMIN.email });
  console.log('Data destroyed.');
}

async function importData() {
  await Hotel.create(readHotels());
  const admin = await User.create(ADMIN);
  await Booking.create(
    [
      ['2026-11-01', '2026-11-02'],
      ['2026-11-02', '2026-11-04'],
      ['2026-11-03', '2026-11-06'],
    ].map(([checkInDate, checkOutDate]) => ({
      checkInDate,
      checkOutDate,
      user: admin._id,
      hotel: APPT_HOTEL_ID,
    })),
  );
  console.log('Data imported.');
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
