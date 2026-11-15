const swaggerJsDoc = require('swagger-jsdoc');
const baseDocs = require('./swagger-base');
const reviewDocs = require('./swagger-reviews');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel API',
      version: '1.0.0',
      description: 'Hotel booking REST API: auth, hotels, bookings and hotel reviews',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}/api/v1` }],
    tags: [...baseDocs.tags, ...reviewDocs.tags],
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
