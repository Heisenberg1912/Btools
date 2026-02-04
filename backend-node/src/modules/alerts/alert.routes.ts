/**
 * Alert Rules Routes
 * CRUD operations for project alert rules
 */

import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import * as mongodb from '../../db/mongodb.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { ALERT_TEMPLATES } from '../../db/models/alert-rule.model.js';

const alertRuleSchema = z.object({
  name: z.string().min(1).max(100),
  metric: z.enum(['budget_overrun', 'progress_delay', 'safety_score', 'worker_shortage', 'compliance_violation', 'delays_increase']),
  condition: z.enum(['>', '<', '>=', '<=', '==', 'changed']),
  threshold: z.number(),
  enabled: z.boolean().optional().default(true),
  notification_channels: z.array(z.enum(['sms', 'whatsapp', 'email'])),
  recipients: z.array(z.string()).min(1),
});

const alertRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/alerts/templates - Get pre-built alert templates
  app.get(
    '/templates',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      return {
        templates: ALERT_TEMPLATES,
      };
    }
  );

  // GET /api/projects/:projectId/alerts - List alert rules for a project
  app.get(
    '/projects/:projectId/alerts',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId = request.userId!;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      const rules = await mongodb.getAlertRules(projectId);

      return {
        project_id: projectId,
        rules: rules.map((rule) => ({
          id: rule._id.toString(),
          name: rule.name,
          metric: rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          enabled: rule.enabled,
          notification_channels: rule.notification_channels,
          recipients: rule.recipients,
          last_triggered: rule.last_triggered?.toISOString() || null,
          trigger_count: rule.trigger_count,
          created_at: rule.created_at.toISOString(),
        })),
      };
    }
  );

  // POST /api/projects/:projectId/alerts - Create alert rule
  app.post(
    '/projects/:projectId/alerts',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
        body: alertRuleSchema,
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const ruleData = request.body;
      const userId = request.userId!;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      const ruleId = await mongodb.createAlertRule(projectId, userId, ruleData);

      if (!ruleId) {
        return reply.status(500).send({
          detail: 'Failed to create alert rule',
        });
      }

      console.log(`🔔 Alert rule created: ${ruleData.name} for project ${projectId}`);

      return reply.status(201).send({
        id: ruleId,
        message: 'Alert rule created successfully',
      });
    }
  );

  // PUT /api/alerts/:ruleId - Update alert rule
  app.put(
    '/:ruleId',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          ruleId: z.string(),
        }),
        body: alertRuleSchema.partial(),
      },
    },
    async (request, reply) => {
      const { ruleId } = request.params;
      const updates = request.body;
      const userId = request.userId!;

      const rule = await mongodb.getAlertRule(ruleId);

      if (!rule) {
        return reply.status(404).send({
          detail: 'Alert rule not found',
        });
      }

      if (rule.user_id.toString() !== userId) {
        return reply.status(403).send({
          detail: 'Not authorized to modify this alert rule',
        });
      }

      const success = await mongodb.updateAlertRule(ruleId, updates);

      if (!success) {
        return reply.status(500).send({
          detail: 'Failed to update alert rule',
        });
      }

      console.log(`🔔 Alert rule updated: ${ruleId}`);

      return {
        message: 'Alert rule updated successfully',
      };
    }
  );

  // DELETE /api/alerts/:ruleId - Delete alert rule
  app.delete(
    '/:ruleId',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          ruleId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { ruleId } = request.params;
      const userId = request.userId!;

      const rule = await mongodb.getAlertRule(ruleId);

      if (!rule) {
        return reply.status(404).send({
          detail: 'Alert rule not found',
        });
      }

      if (rule.user_id.toString() !== userId) {
        return reply.status(403).send({
          detail: 'Not authorized to delete this alert rule',
        });
      }

      const success = await mongodb.deleteAlertRule(ruleId);

      if (!success) {
        return reply.status(500).send({
          detail: 'Failed to delete alert rule',
        });
      }

      console.log(`🔔 Alert rule deleted: ${ruleId}`);

      return {
        message: 'Alert rule deleted successfully',
      };
    }
  );

  // POST /api/alerts/:ruleId/toggle - Toggle alert rule on/off
  app.post(
    '/:ruleId/toggle',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          ruleId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { ruleId } = request.params;
      const userId = request.userId!;

      const rule = await mongodb.getAlertRule(ruleId);

      if (!rule) {
        return reply.status(404).send({
          detail: 'Alert rule not found',
        });
      }

      if (rule.user_id.toString() !== userId) {
        return reply.status(403).send({
          detail: 'Not authorized to modify this alert rule',
        });
      }

      const success = await mongodb.updateAlertRule(ruleId, { enabled: !rule.enabled });

      if (!success) {
        return reply.status(500).send({
          detail: 'Failed to toggle alert rule',
        });
      }

      console.log(`🔔 Alert rule toggled: ${ruleId} → ${!rule.enabled ? 'enabled' : 'disabled'}`);

      return {
        enabled: !rule.enabled,
        message: `Alert rule ${!rule.enabled ? 'enabled' : 'disabled'}`,
      };
    }
  );
};

export default alertRoutes;
