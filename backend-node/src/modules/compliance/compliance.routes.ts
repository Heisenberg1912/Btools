/**
 * Compliance routes - Compliance checks, geo data
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as mongodb from '../../db/mongodb.js';

const complianceRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/compliance/:projectId - Get compliance data
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
        compliance: projectData?.compliance || getDefaultCompliance(),
        geo: projectData?.geo || getDefaultGeo(),
      };
    }
  );

  // GET /api/compliance/:projectId/structural - Get structural compliance
  app.get(
    '/:projectId/structural',
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

      return project.project_data?.compliance || getDefaultCompliance();
    }
  );

  // GET /api/compliance/:projectId/geo - Get geo/environmental data
  app.get(
    '/:projectId/geo',
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

      return project.project_data?.geo || getDefaultGeo();
    }
  );
};

function getDefaultCompliance() {
  return {
    structuralScore: 94,
    fsiUsed: 2.1,
    sustainabilityRating: 'Gold',
    codeViolations: 0,
    embodiedCarbon: '450 tons CO2e',
  };
}

function getDefaultGeo() {
  return {
    soilType: 'Alluvial',
    floodRisk: 'Low',
    seismicZone: 'Zone III',
    climateScore: 78,
    groundwaterLevel: '12m below surface',
    windLoad: 'Class B',
  };
}

export default complianceRoutes;
