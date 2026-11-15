//OpenAPI docs for the hotel review endpoints (R1 to R5), merged into
//config/swagger.js. Kept in its own file so the base docs can change freely.

const error = (description, example) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: { success: false, message: example },
    },
  },
});

const notLoggedIn = error(
  'Not logged in',
  'Not authorize to access this route',
);
const reviewNotFound = error('Review missing or invalid id', 'Review not found');
const badRating = 'Rating must be a whole number between 1 and 5';

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

const reviewIdParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Review id',
};

const auth = [{ bearerAuth: [] }, { cookieAuth: [] }];

const tags = [
  {
    name: 'Review',
    description:
      'Hotel reviews (R1 to R5). After every create, edit and delete the hotel\'s `averageRating` and `reviewCount` are recalculated.',
  },
];

const securitySchemes = {
  cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
};

const schemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
    },
  },
  Review: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6737a1f0c2b4a1e5f0a1b2c3' },
      user: {
        description: 'User id, or `{ _id, name }` where populated',
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: { _id: { type: 'string' }, name: { type: 'string' } },
          },
        ],
      },
      hotel: {
        description: 'Hotel id, or `{ _id, name }` where populated',
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: { _id: { type: 'string' }, name: { type: 'string' } },
          },
        ],
      },
      booking: {
        type: 'string',
        description: 'Booking id (one review per booking)',
      },
      rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
      comment: { type: 'string', maxLength: 1000, example: 'Clean room, friendly staff.' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ReviewInput: {
    type: 'object',
    required: ['rating'],
    properties: {
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        example: 4,
        description: 'Whole number 1 to 5',
      },
      comment: {
        type: 'string',
        maxLength: 1000,
        example: 'Clean room, friendly staff.',
      },
    },
  },
  ReviewUpdate: {
    type: 'object',
    description: 'Only `rating` and `comment` are used; other fields are ignored.',
    properties: {
      rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
      comment: { type: 'string', maxLength: 1000, example: 'Even better on a second look.' },
    },
  },
};

const reviewList = { type: 'array', items: { $ref: '#/components/schemas/Review' } };
const oneReview = { $ref: '#/components/schemas/Review' };

const paths = {
  '/bookings/{bookingId}/reviews': {
    post: {
      tags: ['Review'],
      summary: 'Review the hotel of your own booking after check-out (R1, R2)',
      description:
        'Only the booking\'s owner (admins included) can review it, only after its `checkOutDate` has passed, and only once per booking. `hotel` and `user` are taken from the booking, never from the body.',
      security: auth,
      parameters: [
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Booking id',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReviewInput' },
          },
        },
      },
      responses: {
        201: ok('Review created', oneReview),
        400: {
          description:
            'Before check-out, booking already reviewed, rating not a whole number 1 to 5, or comment over 1000 characters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              examples: {
                beforeCheckOut: {
                  value: {
                    success: false,
                    message: 'You can review this hotel only after your check-out date',
                  },
                },
                alreadyReviewed: {
                  value: { success: false, message: 'You have already reviewed this booking' },
                },
                badRating: { value: { success: false, message: badRating } },
              },
            },
          },
        },
        401: notLoggedIn,
        403: error('Not your booking', 'You can only review your own bookings'),
        404: error('Booking missing or invalid id', 'Booking not found'),
      },
    },
  },
  '/hotels/{hotelId}/reviews': {
    get: {
      tags: ['Review'],
      summary: 'All reviews of a hotel with its average rating (R4, public)',
      description:
        'Newest first. Only the reviewer\'s `name` is shown. `averageRating` is rounded to 1 decimal and is `null` when the hotel has no reviews.',
      parameters: [
        {
          name: 'hotelId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Hotel id',
        },
      ],
      responses: {
        200: ok('Reviews of the hotel', reviewList, {
          count: { type: 'integer', example: 2 },
          averageRating: { type: 'number', nullable: true, example: 4.5 },
        }),
        404: error('Hotel missing or invalid id', 'Hotel not found'),
      },
    },
  },
  '/reviews': {
    get: {
      tags: ['Review'],
      summary: 'Your own reviews; admin gets all reviews (R3)',
      description: 'Newest first, with the hotel\'s `name`.',
      security: auth,
      responses: {
        200: ok('Reviews', reviewList, { count: { type: 'integer', example: 1 } }),
        401: notLoggedIn,
      },
    },
  },
  '/reviews/{id}': {
    get: {
      tags: ['Review'],
      summary: 'One review (R4, public)',
      description: 'With the reviewer\'s `name` and the hotel\'s `name`.',
      parameters: [reviewIdParam],
      responses: {
        200: ok('The review', oneReview),
        404: reviewNotFound,
      },
    },
    put: {
      tags: ['Review'],
      summary: 'Edit your own review (R3, owner only)',
      description:
        'Changes `rating` and/or `comment`. Anyone but the review\'s owner gets 403, admins included.',
      security: auth,
      parameters: [reviewIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReviewUpdate' },
          },
        },
      },
      responses: {
        200: ok('Review updated', oneReview),
        400: error('Rating not a whole number 1 to 5, or comment over 1000 characters', badRating),
        401: notLoggedIn,
        403: error('Not your review', 'You can only edit your own reviews'),
        404: reviewNotFound,
      },
    },
    delete: {
      tags: ['Review'],
      summary: 'Delete your own review (R3); admin deletes any review (R5)',
      security: auth,
      parameters: [reviewIdParam],
      responses: {
        200: ok('Review deleted', { type: 'object', example: {} }),
        401: notLoggedIn,
        403: error('Not your review and not an admin', 'You can only delete your own reviews'),
        404: reviewNotFound,
      },
    },
  },
};

module.exports = { tags, securitySchemes, schemas, paths };
