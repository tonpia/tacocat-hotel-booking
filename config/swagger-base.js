//OpenAPI docs for auth, hotels and bookings (FR1 to FR9), merged into
//config/swagger.js. Matches docs/api.md; review endpoints are in swagger-reviews.js.

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

const notLoggedIn = error('Not logged in', 'Not authorize to access this route');
const notAdmin = error('Logged in but not an admin', 'User role user is not authorized to access this route');
const hotelNotFound = error('Hotel missing or invalid id', 'Hotel not found');
const bookingNotFound = error('Booking missing or invalid id', 'No booking with the id of 6737a1f0c2b4a1e5f0a1b2c3');
const notOwner = error('Not your booking (admins may)', 'User 6737a1f0c2b4a1e5f0a1b2c3 is not authorized to view this booking');
const badDates = error('Missing dates, check-out not after check-in, or not 1 to 3 nights', 'A booking must be 1 to 3 nights');

const auth = [{ bearerAuth: [] }, { cookieAuth: [] }];
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const pathId = (description) => ({
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description,
});
const hotelIdParam = {
  name: 'hotelId',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Hotel id',
};
const jsonBody = (schemaName) => ({
  required: true,
  content: { 'application/json': { schema: ref(schemaName) } },
});

const tags = [
  { name: 'Auth', description: 'Register, log in and out (FR1, FR2)' },
  { name: 'Booking', description: 'Hotel bookings of 1 to 3 nights (FR3 to FR9). Users see and change only their own; admins all.' },
];

const hotelBody = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Chulalongkorn Hotel' },
    address: { type: 'string', example: '1873 Rama IV Road' },
    district: { type: 'string', example: 'Pathum Wan' },
    province: { type: 'string', example: 'Bangkok' },
    postalcode: { type: 'string', example: '10330' },
    tel: { type: 'string', example: '022564000' },
    region: { type: 'string', example: 'Central' },
  },
};

const schemas = {
  Hotel: {
    allOf: [
      {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          averageRating: { type: 'number', nullable: true, example: 4.5, description: 'Null until the first review' },
          reviewCount: { type: 'integer', example: 2 },
        },
      },
      hotelBody,
    ],
  },
  HotelInput: { ...hotelBody, required: ['name', 'address', 'tel'] },
  RegisterInput: {
    type: 'object',
    required: ['name', 'tel', 'email', 'password'],
    properties: {
      name: { type: 'string', example: 'Somchai Jaidee' },
      tel: { type: 'string', example: '0811111111' },
      email: { type: 'string', example: 'somchai@example.com' },
      password: { type: 'string', minLength: 6, example: 'secret123' },
      role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
    },
  },
  LoginInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', example: 'somchai@example.com' },
      password: { type: 'string', example: 'secret123' },
    },
  },
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      tel: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', enum: ['user', 'admin'] },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Booking: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
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
      checkInDate: { type: 'string', format: 'date-time', example: '2026-12-01T00:00:00.000Z' },
      checkOutDate: { type: 'string', format: 'date-time', example: '2026-12-03T00:00:00.000Z' },
      nights: { type: 'integer', example: 2, description: 'Whole days between check-in and check-out' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  BookingInput: {
    type: 'object',
    required: ['checkInDate', 'checkOutDate'],
    properties: {
      checkInDate: { type: 'string', format: 'date', example: '2026-12-01' },
      checkOutDate: { type: 'string', format: 'date', example: '2026-12-03', description: 'After check-in, 1 to 3 nights' },
    },
  },
  BookingUpdate: {
    type: 'object',
    description: 'Dates only. Both dates are checked together, so a partial update must still give 1 to 3 nights.',
    properties: {
      checkInDate: { type: 'string', format: 'date', example: '2026-12-02' },
      checkOutDate: { type: 'string', format: 'date', example: '2026-12-04' },
    },
  },
};

const tokenResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', description: 'JWT; also set as the `token` cookie' },
        },
      },
    },
  },
});

const listQuery = [
  { name: 'select', in: 'query', schema: { type: 'string' }, description: 'Comma separated fields, e.g. `name,province`' },
  { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Comma separated fields, `-` for descending. Default `name`' },
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
  { name: 'province', in: 'query', schema: { type: 'string' }, description: 'Any hotel field can be used as a filter, e.g. `province=Bangkok`' },
];

const paths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a user',
      requestBody: jsonBody('RegisterInput'),
      responses: {
        201: tokenResponse('Registered and logged in'),
        400: error('Missing field, bad email or duplicate email', 'Email already registered'),
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Log in',
      requestBody: jsonBody('LoginInput'),
      responses: {
        200: tokenResponse('Logged in'),
        400: error('Email or password missing', 'Please provide an email and password'),
        401: error('Unknown email or wrong password', 'Invalid credentials'),
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Current user',
      security: auth,
      responses: { 200: ok('The logged-in user', ref('User')), 401: notLoggedIn },
    },
  },
  '/auth/logout': {
    get: {
      tags: ['Auth'],
      summary: 'Log out (clears the cookie)',
      security: auth,
      responses: { 200: ok('Logged out', { type: 'object', example: {} }), 401: notLoggedIn },
    },
  },
  '/hotels': {
    get: {
      tags: ['Hotel'],
      summary: 'List hotels (public)',
      parameters: listQuery,
      responses: {
        200: ok('Hotels, with paging links', { type: 'array', items: ref('Hotel') }, {
          count: { type: 'integer' },
          pagination: { type: 'object', description: '`next` and `prev` with page and limit, when there is one' },
        }),
      },
    },
    post: {
      tags: ['Hotel'],
      summary: 'Add a hotel (admin)',
      security: auth,
      requestBody: jsonBody('HotelInput'),
      responses: {
        201: ok('Hotel created', ref('Hotel')),
        400: error('Missing name, address or tel', 'Please add an address'),
        401: notLoggedIn,
        403: notAdmin,
      },
    },
  },
  '/hotels/{id}': {
    get: {
      tags: ['Hotel'],
      summary: 'Get one hotel (public), with `averageRating` and `reviewCount`',
      parameters: [pathId('Hotel id')],
      responses: { 200: ok('The hotel', ref('Hotel')), 404: hotelNotFound },
    },
    put: {
      tags: ['Hotel'],
      summary: 'Update a hotel (admin)',
      security: auth,
      parameters: [pathId('Hotel id')],
      requestBody: jsonBody('HotelInput'),
      responses: {
        200: ok('Hotel updated', ref('Hotel')),
        400: error('Invalid data, e.g. empty name', 'Please add a hotel name'),
        401: notLoggedIn,
        403: notAdmin,
        404: hotelNotFound,
      },
    },
    delete: {
      tags: ['Hotel'],
      summary: 'Delete a hotel (admin); its bookings and reviews are deleted too',
      security: auth,
      parameters: [pathId('Hotel id')],
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
      summary: 'My bookings (admin: all bookings)',
      security: auth,
      responses: {
        200: ok('Bookings with the hotel\'s name, address and tel', { type: 'array', items: ref('Booking') }, { count: { type: 'integer' } }),
        401: notLoggedIn,
      },
    },
  },
  '/hotels/{hotelId}/bookings': {
    get: {
      tags: ['Booking'],
      summary: 'My bookings at one hotel (admin: all bookings at it)',
      security: auth,
      parameters: [hotelIdParam],
      responses: {
        200: ok('Bookings', { type: 'array', items: ref('Booking') }, { count: { type: 'integer' } }),
        401: notLoggedIn,
      },
    },
    post: {
      tags: ['Booking'],
      summary: 'Book a hotel for 1 to 3 nights',
      security: auth,
      parameters: [hotelIdParam],
      requestBody: jsonBody('BookingInput'),
      responses: {
        201: ok('Booking created for the logged-in user', ref('Booking')),
        400: badDates,
        401: notLoggedIn,
        404: hotelNotFound,
      },
    },
  },
  '/bookings/{id}': {
    get: {
      tags: ['Booking'],
      summary: 'Get a booking (owner or admin)',
      security: auth,
      parameters: [pathId('Booking id')],
      responses: { 200: ok('The booking', ref('Booking')), 401: notLoggedIn, 403: notOwner, 404: bookingNotFound },
    },
    put: {
      tags: ['Booking'],
      summary: 'Change the dates of a booking (owner or admin)',
      security: auth,
      parameters: [pathId('Booking id')],
      requestBody: jsonBody('BookingUpdate'),
      responses: {
        200: ok('Booking updated', ref('Booking')),
        400: badDates,
        401: notLoggedIn,
        403: notOwner,
        404: bookingNotFound,
      },
    },
    delete: {
      tags: ['Booking'],
      summary: 'Delete a booking (owner or admin); its review is deleted too',
      security: auth,
      parameters: [pathId('Booking id')],
      responses: {
        200: ok('Booking deleted', { type: 'object', example: {} }),
        401: notLoggedIn,
        403: notOwner,
        404: bookingNotFound,
      },
    },
  },
};

module.exports = { tags, schemas, paths };
