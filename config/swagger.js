const swaggerJsDoc = require('swagger-jsdoc');
const reviewDocs = require('./swagger-reviews');

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

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Hotel id',
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel API',
      version: '1.0.0',
      description: 'Hotel REST API with bookings (Assignment 10)',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}/api/v1` }],
    tags: [{ name: 'Hotel', description: 'Hotel management' }, ...reviewDocs.tags],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        ...reviewDocs.securitySchemes,
      },
      schemas: {
        Hotel: {
          allOf: [
            { type: 'object', properties: { _id: { type: 'string' } } },
            hotelBody,
          ],
        },
        HotelInput: { ...hotelBody, required: ['name'] },
        ...reviewDocs.schemas,
      },
    },
    paths: {
      '/hotels': {
        get: {
          tags: ['Hotel'],
          summary: 'Get all hotels',
          responses: {
            200: {
              description: 'List of hotels',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      count: { type: 'integer' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Hotel' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Hotel'],
          summary: 'Add one hotel (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HotelInput' },
              },
            },
          },
          responses: {
            201: { description: 'Hotel created' },
            401: { description: 'Not authorize to access this route' },
            403: { description: 'User role is not authorized' },
          },
        },
      },
      '/hotels/{id}': {
        get: {
          tags: ['Hotel'],
          summary: 'Get one hotel',
          parameters: [idParam],
          responses: {
            200: { description: 'The hotel' },
            404: { description: 'Hotel not found' },
          },
        },
        put: {
          tags: ['Hotel'],
          summary: 'Update the hotel (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HotelInput' },
              },
            },
          },
          responses: {
            200: { description: 'Hotel updated' },
            401: { description: 'Not authorize to access this route' },
            404: { description: 'Hotel not found' },
          },
        },
        delete: {
          tags: ['Hotel'],
          summary: 'Delete the hotel (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [idParam],
          responses: {
            200: { description: 'Hotel deleted' },
            401: { description: 'Not authorize to access this route' },
            404: { description: 'Hotel not found' },
          },
        },
      },
      ...reviewDocs.paths,
    },
  },
  apis: [],
};

module.exports = swaggerJsDoc(options);
