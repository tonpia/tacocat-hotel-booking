const swaggerJsDoc = require('swagger-jsdoc');
const reviewDocs = require('./swagger-reviews');
const baseDocs = require('./swagger-base');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel API',
      version: '1.0.0',
      description: 'Hotel REST API with bookings (Assignment 10)',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}/api/v1` }],
    tags: [
      { name: 'Hotel', description: 'Hotels: public list and view, admin add, change and delete (FR3)' },
      ...baseDocs.tags,
      ...reviewDocs.tags,
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        ...reviewDocs.securitySchemes,
      },
      schemas: {
        ...baseDocs.schemas,
        ...reviewDocs.schemas,
      },
    },
    paths: {
      ...baseDocs.paths,
      ...reviewDocs.paths,
    },
  },
  apis: [],
};

module.exports = swaggerJsDoc(options);
