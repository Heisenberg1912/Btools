/**
 * VitruviAI Backend - Node.js/Fastify
 * Main entry point
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

import { config } from './config/index.js';
import { connectMongoDB, disconnectMongoDB, isMongoConnected } from './db/mongodb.js';

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

// Create Fastify instance with custom logger
const app = Fastify({
  logger: {
    level: config.DEBUG ? 'info' : 'warn',
    transport: config.DEBUG
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,reqId,req,res',
            messageFormat: '{msg}',
            colorize: true,
          },
        }
      : undefined,
  },
  disableRequestLogging: true, // We'll add custom request logging
}).withTypeProvider<ZodTypeProvider>();

// Set up Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register plugins - Allow all origins
await app.register(cors, {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.register(multipart, {
  limits: {
    fileSize: config.MAX_UPLOAD_SIZE,
  },
});

// Custom request logging
app.addHook('onRequest', async (request, reply) => {
  const startTime = Date.now();
  request.startTime = startTime;
});

app.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - (request.startTime || Date.now());
  const { method, url } = request;
  const statusCode = reply.statusCode;

  // Skip health checks and root endpoint
  if (url === '/health' || url === '/') return;

  // Get user info if available
  const userId = (request as any).userId;
  const userInfo = userId ? ` [User: ${userId}]` : '';

  // Color code status
  const statusColor = statusCode < 400 ? '✓' : statusCode < 500 ? '⚠' : '✗';

  console.log(`${statusColor} ${method} ${url}${userInfo} → ${statusCode} (${duration}ms)`);
});

// Lifecycle hooks
app.addHook('onReady', async () => {
  console.log(`[App] Starting ${config.APP_NAME} v${config.APP_VERSION}...`);
  await connectMongoDB();
  console.log(`[App] MongoDB connected: ${isMongoConnected()}`);
});

app.addHook('onClose', async () => {
  console.log(`[App] Shutting down ${config.APP_NAME}...`);
  await disconnectMongoDB();
});

// Error handler
app.setErrorHandler((error: any, request, reply) => {
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
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
await app.register(projectRoutes, { prefix: '/api/projects' });
await app.register(financialRoutes, { prefix: '/api/financial' });
await app.register(constructionRoutes, { prefix: '/api/construction' });
await app.register(complianceRoutes, { prefix: '/api/compliance' });
await app.register(reportRoutes, { prefix: '/api/reports' });
await app.register(notificationRoutes, { prefix: '/api/notifications' });
await app.register(alertRoutes, { prefix: '/api/alerts' });
await app.register(portfolioRoutes, { prefix: '/api/portfolio' });

// Start server
const start = async () => {
  try {
    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });
    console.log(`[App] Server listening on http://localhost:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[App] Received SIGINT, shutting down gracefully...');
  await app.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[App] Received SIGTERM, shutting down gracefully...');
  await app.close();
  process.exit(0);
});
