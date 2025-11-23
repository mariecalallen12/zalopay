/**
 * Swagger/OpenAPI documentation setup
 */

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('../config');
const logger = require('../utils/logger');

/**
 * Load Swagger YAML file
 * Supports OpenAPI 3.1.0 specification
 */
function loadSwaggerYAML() {
  try {
    const swaggerPath = path.join(__dirname, '..', 'docs', 'swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
      const fileContents = fs.readFileSync(swaggerPath, 'utf8');
      const spec = yaml.load(fileContents);
      
      // Validate OpenAPI version
      if (spec && spec.openapi) {
        const version = spec.openapi;
        if (version.startsWith('3.1') || version.startsWith('3.0')) {
          if (logger && logger.info) {
            logger.info(`Loaded OpenAPI ${version} specification from swagger.yaml`);
          } else {
            console.log(`Loaded OpenAPI ${version} specification from swagger.yaml`);
          }
          return spec;
        } else {
          const warnMsg = `Unsupported OpenAPI version: ${version}. Expected 3.0.x or 3.1.x`;
          if (logger && logger.warn) {
            logger.warn(warnMsg);
          } else {
            console.warn(warnMsg);
          }
        }
      }
      
      return spec;
    }
  } catch (error) {
    const errorMsg = `Error loading Swagger YAML: ${error.message}`;
    if (logger && logger.warn) {
      logger.warn(errorMsg);
    } else {
      console.warn(errorMsg);
    }
  }
  return null;
}

/**
 * Swagger JSDoc options
 * Note: This is a fallback if YAML file is not found
 */
const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'DogeRat API',
      version: '1.0.0',
      description: 'API documentation for DogeRat server',
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Development server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '..', 'routes', '**', '*.js'),
    path.join(__dirname, '..', 'server.js'),
  ],
};

/**
 * Try to load YAML first, fallback to JSDoc
 */
let swaggerSpec = loadSwaggerYAML();

if (!swaggerSpec) {
  swaggerSpec = swaggerJsdoc(swaggerOptions);
}

/**
 * Swagger UI options
 */
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DogeRat API Documentation',
};

/**
 * Attach Swagger middleware to the provided Express app
 * @param {import('express').Express} app
 */
function setupSwagger(app) {
  if (!app || typeof app.use !== 'function') {
    return;
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
}

module.exports = {
  swaggerSpec,
  swaggerUiOptions,
  swaggerUi,
  setupSwagger,
};

