/**
 * Portfolio Routes
 * Aggregate views across all user projects
 */

import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as portfolioService from './portfolio.service.js';

const portfolioRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/portfolio/summary - Aggregate portfolio stats
  app.get(
    '/summary',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const userId = request.userId!;

      const summary = await portfolioService.getPortfolioSummary(userId);

      console.log(`📊 Portfolio summary generated for user ${userId.slice(-6)}`);

      return summary;
    }
  );

  // GET /api/portfolio/comparison - Compare projects
  app.get(
    '/comparison',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: z.object({
          projects: z.string().optional(), // Comma-separated project IDs
        }),
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const { projects } = request.query;

      const projectIds = projects ? projects.split(',') : undefined;

      const comparisons = await portfolioService.compareProjects(userId, projectIds);

      return {
        projects: comparisons,
        count: comparisons.length,
      };
    }
  );

  // GET /api/portfolio/top-risks - Get highest-risk projects
  app.get(
    '/top-risks',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: z.object({
          limit: z.string().optional().default('5').transform(Number),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const { limit } = request.query;

      const topRisks = await portfolioService.getTopRiskProjects(userId, limit);

      return {
        projects: topRisks,
        count: topRisks.length,
      };
    }
  );

  // GET /api/portfolio/resource-allocation - Show manpower/machinery distribution
  app.get(
    '/resource-allocation',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const userId = request.userId!;
      const mongodb = await import('../../db/mongodb.js');
      const projects = await mongodb.getUserProjects(userId);

      const resourceAllocation = projects.map((project) => {
        const data = project.project_data;
        return {
          project_id: project._id.toString(),
          name: project.name,
          workers: data?.manpower?.total || 0,
          machinery_units: data?.machinery?.activeUnits || 0,
          budget_allocated: data?.financials?.budgetTotal || 0,
        };
      });

      const totals = resourceAllocation.reduce(
        (acc, p) => ({
          total_workers: acc.total_workers + p.workers,
          total_machinery: acc.total_machinery + p.machinery_units,
          total_budget: acc.total_budget + p.budget_allocated,
        }),
        { total_workers: 0, total_machinery: 0, total_budget: 0 }
      );

      return {
        by_project: resourceAllocation,
        totals: {
          ...totals,
          projects_count: projects.length,
        },
      };
    }
  );
};

export default portfolioRoutes;
