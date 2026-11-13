const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const Hospital = require('./models/Hospital');
const User = require('./models/User');
const Appointment = require('./models/Appointment');

//Fixed id that the test collection expects for this hospital
const APPT_HOSPITAL_NAME = 'รักษ์สกล';
const APPT_HOSPITAL_ID = '6ab8cf3ded32aea2b87adb42';

const ADMIN = {
  name: 'admin',
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

//Read hospital.csv into hospital documents
function readHospitals() {
  const csv = fs
    .readFileSync(path.join(__dirname, '_data', 'hospital.csv'), 'utf8')
    .replace(/^﻿/, '');
  const [header, ...lines] = csv.split(/\r?\n/).filter((line) => line.trim());
  const fields = splitCsvLine(header);

  return lines.map((line) => {
    const values = splitCsvLine(line);
    const hospital = {};
    fields.forEach((field, index) => {
      hospital[field] = values[index];
    });
    //Drop the running number column, it is not part of the model
    delete hospital[fields[0]];
    if (hospital.name === APPT_HOSPITAL_NAME) {
      hospital._id = APPT_HOSPITAL_ID;
    }
    return hospital;
  });
}

async function deleteData() {
  await Appointment.deleteMany();
  await Hospital.deleteMany();
  await User.deleteOne({ email: ADMIN.email });
  console.log('Data destroyed.');
}

async function importData() {
  await Hospital.create(readHospitals());
  const admin = await User.create(ADMIN);
  await Appointment.create(
    ['2026-11-01', '2026-11-02', '2026-11-03'].map((apptDate) => ({
      apptDate,
      user: admin._id,
      hospital: APPT_HOSPITAL_ID,
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
