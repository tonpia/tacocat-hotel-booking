//Test runner: starts a throwaway MongoDB in memory, seeds it, starts the API on a
//random port and runs every Postman collection in tests/collections with Newman.
//The database is wiped and re-seeded before each collection, so collections are
//independent of each other. No real database or secrets are needed.
//
//Usage: npm test                      (all collections)
//       npm test -- bookings           (only collections whose file name contains "bookings")

const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const newman = require('newman');

const COLLECTIONS_DIR = path.join(__dirname, 'collections');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function runCollection(collectionPath, envValues) {
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection: require(collectionPath),
        envVar: Object.entries(envValues).map(([key, value]) => ({
          key,
          value: String(value),
        })),
        reporters: ['cli'],
        reporter: { cli: { noSummary: false } },
      },
      (error, summary) => {
        if (error) return reject(error);
        resolve(summary.run.failures.length);
      },
    );
  });
}

//Every file in tests/fixtures exports async seed(mongoose) returning an object of
//values (ids, emails, passwords) that collections can use as {{name}}.
async function seedAll(mongoose) {
  const values = {};
  const files = fs
    .readdirSync(FIXTURES_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort();
  for (const file of files) {
    const fixture = require(path.join(FIXTURES_DIR, file));
    Object.assign(values, await fixture.seed(mongoose, values));
  }
  return values;
}

async function main() {
  const filter = process.argv[2] || '';
  const mongo = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = mongo.getUri('tacocat-test');
  process.env.JWT_SECRET = 'test-only-secret';
  process.env.JWT_EXPIRE = '1d';
  process.env.JWT_COOKIE_EXPIRE = '1';
  process.env.RATE_LIMIT_MAX = '100000';

  const mongoose = require('mongoose');
  const app = require('../server');
  await mongoose.connect(process.env.MONGO_URI);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const collections = fs
    .readdirSync(COLLECTIONS_DIR)
    .filter((file) => file.endsWith('.postman_collection.json'))
    .filter((file) => file.includes(filter))
    .sort();

  let failures = 0;
  try {
    for (const file of collections) {
      await mongoose.connection.dropDatabase();
      //Rebuild unique indexes that dropDatabase removed
      await Promise.all(
        Object.values(mongoose.models).map((model) => model.syncIndexes()),
      );
      const values = await seedAll(mongoose);
      console.log(`\n=== ${file}`);
      failures += await runCollection(path.join(COLLECTIONS_DIR, file), {
        baseUrl,
        ...values,
      });
    }
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongo.stop();
  }

  console.log(
    `\n${collections.length} collection(s), ${failures} failed assertion(s).`,
  );
  process.exit(failures === 0 && collections.length > 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
