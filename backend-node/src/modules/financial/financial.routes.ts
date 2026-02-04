/**
 * Financial routes - Budget, transactions, valuations
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as mongodb from '../../db/mongodb.js';

const financialRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/financial/:projectId - Get financial data for project
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

      // Return financial data from project_data if available
      const projectData = project.project_data;
      if (projectData?.financials) {
        return {
          ...projectData.financials,
          valuation: projectData.valuation || {},
        };
      }

      // Return default financial data
      return {
        budgetTotal: 5000000,
        budgetSpent: 2250000,
        budgetRemaining: 2750000,
        costOverrun: 0,
        projectedFinalCost: 5000000,
        cashFlowHealth: 'Positive',
        roiProjection: 18.5,
        monthlyCashFlow: [
          { month: 'Jan', inflow: 500000, outflow: 450000 },
          { month: 'Feb', inflow: 600000, outflow: 550000 },
          { month: 'Mar', inflow: 550000, outflow: 600000 },
          { month: 'Apr', inflow: 700000, outflow: 650000 },
          { month: 'May', inflow: 650000, outflow: 600000 },
        ],
        valuation: {
          current: 2500000,
          landValue: 1000000,
          projectedCompletedValue: 4500000,
          appreciationForecast: 12.5,
          rentalYield: 6.8,
        },
      };
    }
  );

  // GET /api/financial/:projectId/budget - Get budget breakdown
  app.get(
    '/:projectId/budget',
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
        distribution: projectData?.charts?.budgetDistribution || [
          { name: 'Materials', value: 45 },
          { name: 'Labor', value: 30 },
          { name: 'Machinery', value: 15 },
          { name: 'Overheads', value: 10 },
        ],
        total: projectData?.financials?.budgetTotal || 5000000,
        spent: projectData?.financials?.budgetSpent || 2250000,
      };
    }
  );

  // GET /api/financial/:projectId/valuation - Get valuation data
  app.get(
    '/:projectId/valuation',
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
        current: projectData?.valuation?.current || 2500000,
        landValue: projectData?.valuation?.landValue || 1000000,
        projectedCompletedValue: projectData?.valuation?.projectedCompletedValue || 4500000,
        appreciationForecast: projectData?.valuation?.appreciationForecast || 12.5,
        rentalYield: projectData?.valuation?.rentalYield || 6.8,
        nearbyTransactions: projectData?.valuation?.nearbyTransactions || [
          { address: '123 Nearby St', price: 1200000, date: '2024-01' },
          { address: '456 Adjacent Ave', price: 1350000, date: '2024-02' },
          { address: '789 Close Rd', price: 1100000, date: '2023-12' },
        ],
        growth: projectData?.charts?.valuationGrowth || [
          { year: '2024', value: 2500000 },
          { year: '2025', value: 2875000 },
          { year: '2026', value: 4500000 },
        ],
      };
    }
  );
};

export default financialRoutes;
