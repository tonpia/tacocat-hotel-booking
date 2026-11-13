const swaggerJsDoc = require('swagger-jsdoc');

const hospitalBody = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Chulalongkorn Hospital' },
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
  description: 'Hospital id',
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital API',
      version: '1.0.0',
      description: 'Hospital REST API with appointments (Assignment 10)',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}/api/v1` }],
    tags: [{ name: 'Hospital', description: 'Hospital management' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Hospital: {
          allOf: [
            { type: 'object', properties: { _id: { type: 'string' } } },
            hospitalBody,
          ],
        },
        HospitalInput: { ...hospitalBody, required: ['name'] },
      },
    },
    paths: {
      '/hospitals': {
        get: {
          tags: ['Hospital'],
          summary: 'Get all hospitals',
          responses: {
            200: {
              description: 'List of hospitals',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      count: { type: 'integer' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Hospital' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Hospital'],
          summary: 'Add one hospital (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HospitalInput' },
              },
            },
          },
          responses: {
            201: { description: 'Hospital created' },
            401: { description: 'Not authorize to access this route' },
            403: { description: 'User role is not authorized' },
          },
        },
      },
      '/hospitals/{id}': {
        get: {
          tags: ['Hospital'],
          summary: 'Get one hospital',
          parameters: [idParam],
          responses: {
            200: { description: 'The hospital' },
            404: { description: 'Hospital not found' },
          },
        },
        put: {
          tags: ['Hospital'],
          summary: 'Update the hospital (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HospitalInput' },
              },
            },
          },
          responses: {
            200: { description: 'Hospital updated' },
            401: { description: 'Not authorize to access this route' },
            404: { description: 'Hospital not found' },
          },
        },
        delete: {
          tags: ['Hospital'],
          summary: 'Delete the hospital (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [idParam],
          responses: {
            200: { description: 'Hospital deleted' },
            401: { description: 'Not authorize to access this route' },
            404: { description: 'Hospital not found' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsDoc(options);
