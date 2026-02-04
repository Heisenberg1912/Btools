/**
 * Notifications routes - Twilio SMS/WhatsApp integration
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as mongodb from '../../db/mongodb.js';
import { sendSMS, sendWhatsApp } from './notification.service.js';

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/notifications - Get all notifications for current user
  app.get(
    '',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: z.object({
          unread_only: z.string().optional().transform(v => v === 'true'),
          limit: z.string().optional().default('50').transform(Number),
        }),
      },
    },
    async (request) => {
      const { unread_only, limit } = request.query;
      const userId = request.userId!;

      const notifications = await mongodb.getUserNotifications(userId, unread_only, limit);

      return notifications.map(notif => ({
        id: notif._id.toString(),
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        created_at: notif.created_at.toISOString(),
      }));
    }
  );

  // POST /api/notifications/mark-read - Mark notifications as read
  app.post(
    '/mark-read',
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          notification_ids: z.array(z.string()).min(1),
        }),
      },
    },
    async (request) => {
      const { notification_ids } = request.body;

      const count = await mongodb.markNotificationsRead(notification_ids);

      return {
        marked_read: count,
      };
    }
  );

  // POST /api/notifications/send-sms - Send SMS notification
  app.post(
    '/send-sms',
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          to: z.string().min(10, 'Phone number is required'),
          message: z.string().min(1, 'Message is required'),
        }),
      },
    },
    async (request, reply) => {
      const { to, message } = request.body;
      const userId = request.userId!;

      try {
        const result = await sendSMS(to, message);

        // Create notification record
        await mongodb.createNotification(userId, 'sms', 'SMS Sent', `SMS sent to ${to}`);

        return {
          success: true,
          sid: result?.sid || 'simulated',
        };
      } catch (error) {
        return reply.status(500).send({
          detail: `Failed to send SMS: ${String(error)}`,
        });
      }
    }
  );

  // POST /api/notifications/send-whatsapp - Send WhatsApp notification
  app.post(
    '/send-whatsapp',
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          to: z.string().min(10, 'Phone number is required'),
          message: z.string().min(1, 'Message is required'),
        }),
      },
    },
    async (request, reply) => {
      const { to, message } = request.body;
      const userId = request.userId!;

      try {
        const result = await sendWhatsApp(to, message);

        // Create notification record
        await mongodb.createNotification(userId, 'whatsapp', 'WhatsApp Sent', `WhatsApp sent to ${to}`);

        return {
          success: true,
          sid: result?.sid || 'simulated',
        };
      } catch (error) {
        return reply.status(500).send({
          detail: `Failed to send WhatsApp: ${String(error)}`,
        });
      }
    }
  );

  // POST /api/notifications - Create a new notification
  app.post(
    '',
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          type: z.string().default('info'),
          title: z.string().min(1, 'Title is required'),
          message: z.string().min(1, 'Message is required'),
        }),
      },
    },
    async (request, reply) => {
      const { type, title, message } = request.body;
      const userId = request.userId!;

      const notifId = await mongodb.createNotification(userId, type, title, message);

      if (!notifId) {
        return reply.status(500).send({
          detail: 'Failed to create notification',
        });
      }

      return {
        id: notifId,
        type,
        title,
        message,
        read: false,
        created_at: new Date().toISOString(),
      };
    }
  );
};

export default notificationRoutes;
