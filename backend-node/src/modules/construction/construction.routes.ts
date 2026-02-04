/**
 * Construction routes - Manpower, machinery, materials, tasks
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as mongodb from '../../db/mongodb.js';

const constructionRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/construction/:projectId - Get all construction data
  app.get(
    '/:projectId',
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

      const projectData = project.project_data;

      return {
        manpower: projectData?.manpower || getDefaultManpower(),
        machinery: projectData?.machinery || getDefaultMachinery(),
        materials: projectData?.materials || getDefaultMaterials(),
      };
    }
  );

  // GET /api/construction/:projectId/manpower - Get manpower data
  app.get(
    '/:projectId/manpower',
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

      return project.project_data?.manpower || getDefaultManpower();
    }
  );

  // GET /api/construction/:projectId/machinery - Get machinery data
  app.get(
    '/:projectId/machinery',
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

      return project.project_data?.machinery || getDefaultMachinery();
    }
  );

  // GET /api/construction/:projectId/materials - Get materials data
  app.get(
    '/:projectId/materials',
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

      return project.project_data?.materials || getDefaultMaterials();
    }
  );

  // GET /api/construction/:projectId/progress - Get progress data
  app.get(
    '/:projectId/progress',
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

      const projectData = project.project_data;

      return {
        stage: projectData?.stage || 'In Progress',
        progressPercentage: projectData?.progressPercentage || 50,
        timeRemaining: projectData?.timeRemaining || 'Unknown',
        criticalPath: projectData?.criticalPath || 'Structural Work',
        delaysFlagged: projectData?.delaysFlagged || 0,
        progressOverTime: projectData?.charts?.progressOverTime || [
          { name: 'Month 1', actual: 10, projected: 12 },
          { name: 'Month 2', actual: 25, projected: 25 },
          { name: 'Month 3', actual: 38, projected: 40 },
          { name: 'Month 4', actual: 52, projected: 55 },
          { name: 'Month 5', actual: 65, projected: 70 },
        ],
      };
    }
  );
};

function getDefaultManpower() {
  return {
    total: 53,
    skilled: 33,
    unskilled: 20,
    productivityIndex: 78,
    safetyScore: 92,
    skillDistribution: [
      { name: 'Mason', count: 15 },
      { name: 'Carpenter', count: 8 },
      { name: 'Electrician', count: 6 },
      { name: 'Plumber', count: 4 },
      { name: 'Laborer', count: 20 },
    ],
    idleWorkers: 3,
  };
}

function getDefaultMachinery() {
  return {
    utilization: 72,
    activeUnits: 8,
    maintenanceAlerts: 1,
    fuelConsumption: 450,
    efficiencyRatio: 85,
  };
}

function getDefaultMaterials() {
  return [
    { name: 'Cement', allocated: 1000, used: 450, wastage: 5, risk: 'Low' },
    { name: 'Steel', allocated: 500, used: 200, wastage: 3, risk: 'Low' },
    { name: 'Bricks', allocated: 50000, used: 22000, wastage: 8, risk: 'Medium' },
    { name: 'Glass', allocated: 200, used: 50, wastage: 2, risk: 'Low' },
    { name: 'Wood', allocated: 300, used: 100, wastage: 10, risk: 'Medium' },
  ];
}

export default constructionRoutes;
