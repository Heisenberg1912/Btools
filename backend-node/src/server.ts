/**
 * VitruviAI Backend - Serverless Export
 * This file exports the Fastify app for use in serverless environments (Vercel)
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

import { config } from './config/index.js';
import { connectMongoDB, isMongoConnected } from './db/mongodb.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import subscriptionRoutes from './modules/subscriptions/subscription.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import financialRoutes from './modules/financial/financial.routes.js';
import constructionRoutes from './modules/construction/construction.routes.js';
import complianceRoutes from './modules/compliance/compliance.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import alertRoutes from './modules/alerts/alert.routes.js';
import portfolioRoutes from './modules/portfolio/portfolio.routes.js';

// Create Fastify instance (no pino-pretty for serverless - reduces bundle size)
const app = Fastify({
  logger: {
    level: 'warn',
  },
  disableRequestLogging: true,
}).withTypeProvider<ZodTypeProvider>();

// Set up Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register plugins
app.register(cors, {
  origin: true, // Allow all origins in serverless (headers are set by Vercel)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

app.register(multipart, {
  limits: {
    fileSize: config.MAX_UPLOAD_SIZE,
  },
});

// Connect to MongoDB on first request (connection pooling for serverless)
// Single promise shared by all concurrent requests during cold start —
// prevents the race where a second request skips the await and hits db = null.
let connectionPromise: Promise<void> | null = null;

app.addHook('onRequest', async () => {
  if (!isMongoConnected()) {
    if (!connectionPromise) {
      connectionPromise = connectMongoDB().finally(() => {
        if (!isMongoConnected()) connectionPromise = null; // allow retry on failure
      });
    }
    await connectionPromise;
  }
});

// Error handler
app.setErrorHandler((error: Error & { validation?: unknown; statusCode?: number }, request, reply) => {
  console.error('[Error]', error);

  // Zod validation errors
  if (error.validation) {
    return reply.status(400).send({
      detail: 'Validation error',
      errors: error.validation,
    });
  }

  // Standard HTTP errors
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      detail: error.message,
    });
  }

  // Unknown errors
  return reply.status(500).send({
    detail: 'Internal server error',
  });
});

// Root endpoint
app.get('/', async () => {
  return {
    name: config.APP_NAME,
    version: config.APP_VERSION,
    status: 'running',
    database: 'MongoDB',
    environment: 'serverless',
  };
});

// Health check
app.get('/health', async () => {
  return {
    status: 'healthy',
    mongodb: isMongoConnected(),
  };
});

// API info
app.get('/api', async () => {
  return {
    name: config.APP_NAME,
    version: config.APP_VERSION,
    database: 'MongoDB',
    endpoints: {
      auth: '/api/auth',
      subscriptions: '/api/subscriptions',
      projects: '/api/projects',
      financial: '/api/financial',
      construction: '/api/construction',
      compliance: '/api/compliance',
      reports: '/api/reports',
      notifications: '/api/notifications',
      alerts: '/api/alerts',
      portfolio: '/api/portfolio',
    },
  };
});

// Register routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
app.register(projectRoutes, { prefix: '/api/projects' });
app.register(financialRoutes, { prefix: '/api/financial' });
app.register(constructionRoutes, { prefix: '/api/construction' });
app.register(complianceRoutes, { prefix: '/api/compliance' });
app.register(reportRoutes, { prefix: '/api/reports' });
app.register(notificationRoutes, { prefix: '/api/notifications' });
app.register(alertRoutes, { prefix: '/api/alerts' });
app.register(portfolioRoutes, { prefix: '/api/portfolio' });

export default app;
