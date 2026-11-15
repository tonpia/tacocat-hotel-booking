//OpenAPI docs for auth, hotels and bookings (docs/api.md), merged into
//config/swagger.js. The review docs are in config/swagger-reviews.js.

const error = (description, example) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: { success: false, message: example },
    },
  },
});

const ok = (description, data, extra = {}) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true }, ...extra, data },
      },
    },
  },
});

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });

const notLoggedIn = error('Not logged in', 'Not authorize to access this route');
const notAdmin = error(
  'Logged in but not an admin',
  'User role user is not authorized to access this route',
);
const hotelNotFound = error('Hotel missing or invalid id', 'Hotel not found');
const bookingNotFound = error(
  'Booking missing or invalid id',
  'No booking with the id of 6737a1f0c2b4a1e5f0a1b2c3',
);
const notOwner = (action) =>
  error(
    'Not your booking (admins are allowed)',
    `User 6737a1f0c2b4a1e5f0a1b2c3 is not authorized to ${action} this booking`,
  );
const badDates = error(
  'Missing or invalid dates, check-out not after check-in, or stay is not 1 to 3 nights',
  'A booking must be 1 to 3 nights',
);

const auth = [{ bearerAuth: [] }, { cookieAuth: [] }];

const hotelIdParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Hotel id',
};
const hotelIdOfBookings = {
  name: 'hotelId',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Hotel id',
};
const bookingIdParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Booking id',
};

const tags = [
  { name: 'Auth', description: 'Register, log in and out, current user (FR1, FR2)' },
  { name: 'Hotel', description: 'Hotels: public read, admin write (FR3)' },
  {
    name: 'Booking',
    description:
      'Bookings of 1 to 3 nights. Users see and change only their own; admins see and change all (FR3 to FR9).',
  },
];

const hotelProps = {
  name: { type: 'string', example: 'Chulalongkorn Hotel' },
  address: { type: 'string', example: '1873 Rama IV Road' },
  district: { type: 'string', example: 'Pathum Wan' },
  province: { type: 'string', example: 'Bangkok' },
  postalcode: { type: 'string', example: '10330' },
  tel: { type: 'string', example: '022564000' },
  region: { type: 'string', example: 'Central' },
};

const schemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
    },
  },
  Hotel: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6737a1f0c2b4a1e5f0a1b2c3' },
      ...hotelProps,
      averageRating: {
        type: 'number',
        nullable: true,
        example: 4.5,
        description: 'Average of the hotel reviews, null when there are none',
      },
      reviewCount: { type: 'integer', example: 2 },
    },
  },
  HotelInput: {
    type: 'object',
    required: ['name', 'address', 'tel'],
    properties: hotelProps,
  },
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string', example: 'Somchai' },
      tel: { type: 'string', example: '0812345678' },
      email: { type: 'string', example: 'somchai@example.com' },
      role: { type: 'string', enum: ['user', 'admin'] },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  RegisterInput: {
    type: 'object',
    required: ['name', 'tel', 'email', 'password'],
    properties: {
      name: { type: 'string', example: 'Somchai' },
      tel: { type: 'string', example: '0812345678' },
      email: { type: 'string', example: 'somchai@example.com' },
      password: { type: 'string', minLength: 6, example: '12345678' },
    },
  },
  LoginInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', example: 'user1@gmail.com' },
      password: { type: 'string', example: '12345678' },
    },
  },
  Token: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      token: { type: 'string', description: 'JWT, also set as the `token` cookie' },
    },
  },
  Booking: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6737a1f0c2b4a1e5f0a1b2c3' },
      user: { type: 'string', description: 'User id' },
      hotel: {
        description: 'Hotel id, or `{ _id, name, address, tel }` where populated',
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              tel: { type: 'string' },
            },
          },
        ],
      },
      checkInDate: { type: 'string', format: 'date-time' },
      checkOutDate: { type: 'string', format: 'date-time' },
      nights: { type: 'integer', example: 2, description: 'Whole days between check-in and check-out' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  BookingInput: {
    type: 'object',
    required: ['checkInDate', 'checkOutDate'],
    properties: {
      checkInDate: { type: 'string', format: 'date-time', example: '2026-12-01T00:00:00.000Z' },
      checkOutDate: {
        type: 'string',
        format: 'date-time',
        example: '2026-12-03T00:00:00.000Z',
        description: 'After check-in, at most 3 nights later',
      },
    },
  },
};

const paths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a user',
      requestBody: { required: true, content: json(ref('RegisterInput')) },
      responses: {
        201: { description: 'Registered', content: json(ref('Token')) },
        400: error('Missing or invalid field, or email already registered', 'Please add a telephone number'),
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Log in',
      requestBody: { required: true, content: json(ref('LoginInput')) },
      responses: {
        200: { description: 'Logged in', content: json(ref('Token')) },
        400: error('Email or password missing', 'Please provide an email and password'),
        401: error('Unknown email or wrong password', 'Invalid credentials'),
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get the logged-in user',
      security: auth,
      responses: {
        200: ok('The user', ref('User')),
        401: notLoggedIn,
      },
    },
  },
  '/auth/logout': {
    get: {
      tags: ['Auth'],
      summary: 'Log out (clears the cookie)',
      security: auth,
      responses: {
        200: ok('Logged out', { type: 'object', example: {} }),
        401: notLoggedIn,
      },
    },
  },
  '/hotels': {
    get: {
      tags: ['Hotel'],
      summary: 'List hotels',
      description: 'Public. Supports field filters, `select`, `sort`, `page` and `limit`.',
      parameters: [
        { name: 'select', in: 'query', schema: { type: 'string' }, description: 'Comma separated fields, e.g. `name,tel`' },
        { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Comma separated fields, `-` for descending. Default `name`.' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
      ],
      responses: {
        200: ok('Hotels', { type: 'array', items: ref('Hotel') }, {
          count: { type: 'integer' },
          pagination: {
            type: 'object',
            description: '`next` and `prev` (each `{ page, limit }`) appear only when that page exists',
          },
        }),
      },
    },
    post: {
      tags: ['Hotel'],
      summary: 'Add a hotel (admin)',
      security: auth,
      requestBody: { required: true, content: json(ref('HotelInput')) },
      responses: {
        201: ok('Hotel created', ref('Hotel')),
        400: error('Invalid hotel', 'Please add an address'),
        401: notLoggedIn,
        403: notAdmin,
      },
    },
  },
  '/hotels/{id}': {
    get: {
      tags: ['Hotel'],
      summary: 'Get a hotel (public)',
      parameters: [hotelIdParam],
      responses: { 200: ok('The hotel', ref('Hotel')), 404: hotelNotFound },
    },
    put: {
      tags: ['Hotel'],
      summary: 'Update a hotel (admin)',
      security: auth,
      parameters: [hotelIdParam],
      requestBody: { required: true, content: json(ref('HotelInput')) },
      responses: {
        200: ok('Hotel updated', ref('Hotel')),
        400: error('Invalid hotel', 'Please add a hotel name'),
        401: notLoggedIn,
        403: notAdmin,
        404: hotelNotFound,
      },
    },
    delete: {
      tags: ['Hotel'],
      summary: 'Delete a hotel and its bookings and reviews (admin)',
      security: auth,
      parameters: [hotelIdParam],
      responses: {
        200: ok('Hotel deleted', { type: 'object', example: {} }),
        401: notLoggedIn,
        403: notAdmin,
        404: hotelNotFound,
      },
    },
  },
  '/bookings': {
    get: {
      tags: ['Booking'],
      summary: 'List bookings',
      description: 'A user sees their own bookings, an admin sees all. The hotel is populated with `name`, `address` and `tel`.',
      security: auth,
      responses: {
        200: ok('Bookings', { type: 'array', items: ref('Booking') }, { count: { type: 'integer' } }),
        401: notLoggedIn,
      },
    },
  },
  '/hotels/{hotelId}/bookings': {
    get: {
      tags: ['Booking'],
      summary: 'List bookings of one hotel',
      description: 'Same visibility rule as `GET /bookings`, limited to this hotel.',
      security: auth,
      parameters: [hotelIdOfBookings],
      responses: {
        200: ok('Bookings', { type: 'array', items: ref('Booking') }, { count: { type: 'integer' } }),
        401: notLoggedIn,
      },
    },
    post: {
      tags: ['Booking'],
      summary: 'Book a hotel',
      description: 'The stay must be 1 to 3 nights.',
      security: auth,
      parameters: [hotelIdOfBookings],
      requestBody: { required: true, content: json(ref('BookingInput')) },
      responses: {
        201: ok('Booking created', ref('Booking')),
        400: badDates,
        401: notLoggedIn,
        404: error('Hotel missing', 'No hotel with the id of 6737a1f0c2b4a1e5f0a1b2c3'),
      },
    },
  },
  '/bookings/{id}': {
    get: {
      tags: ['Booking'],
      summary: 'Get a booking (owner or admin)',
      security: auth,
      parameters: [bookingIdParam],
      responses: {
        200: ok('The booking', ref('Booking')),
        401: notLoggedIn,
        403: notOwner('view'),
        404: bookingNotFound,
      },
    },
    put: {
      tags: ['Booking'],
      summary: 'Change the dates of a booking (owner or admin)',
      description: 'Dates only, same validation as creating.',
      security: auth,
      parameters: [bookingIdParam],
      requestBody: { required: true, content: json(ref('BookingInput')) },
      responses: {
        200: ok('Booking updated', ref('Booking')),
        400: badDates,
        401: notLoggedIn,
        403: notOwner('update'),
        404: bookingNotFound,
      },
    },
    delete: {
      tags: ['Booking'],
      summary: 'Delete a booking and its review (owner or admin)',
      security: auth,
      parameters: [bookingIdParam],
      responses: {
        200: ok('Booking deleted', { type: 'object', example: {} }),
        401: notLoggedIn,
        403: notOwner('delete'),
        404: bookingNotFound,
      },
    },
  },
};

module.exports = { tags, schemas, paths };
