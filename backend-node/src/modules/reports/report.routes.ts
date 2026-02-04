/**
 * Reports routes - PDF, Excel, PowerPoint generation
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth, requirePremium } from '../../middleware/auth.middleware.js';
import * as mongodb from '../../db/mongodb.js';
import { generatePDF } from './generators/pdf.generator.js';
import { generateExcel } from './generators/excel.generator.js';
import { generatePPTX } from './generators/pptx.generator.js';

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/reports/:projectId - Get all reports for a project
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

      const reports = await mongodb.getProjectReports(projectId);

      return reports.map(report => ({
        id: report._id.toString(),
        project_id: report.project_id.toString(),
        report_type: report.report_type,
        report_format: report.report_format,
        file_url: report.file_url,
        created_at: report.created_at.toISOString(),
      }));
    }
  );

  // POST /api/reports/:projectId/generate - Generate a new report
  app.post(
    '/:projectId/generate',
    {
      preHandler: [requirePremium],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
        body: z.object({
          report_type: z.enum(['summary', 'detailed', 'financial', 'compliance']).default('summary'),
          report_format: z.enum(['pdf', 'excel', 'pptx']).default('pdf'),
        }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const { report_type, report_format } = request.body;
      const userId = request.userId!;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      // Generate report based on format
      let fileUrl: string;
      try {
        const projectData = project.project_data || {};

        switch (report_format) {
          case 'pdf':
            fileUrl = await generatePDF(project, projectData, report_type);
            break;
          case 'excel':
            fileUrl = await generateExcel(project, projectData, report_type);
            break;
          case 'pptx':
            fileUrl = await generatePPTX(project, projectData, report_type);
            break;
          default:
            return reply.status(400).send({
              detail: 'Invalid report format',
            });
        }
      } catch (error) {
        console.error('[Reports] Generation error:', error);
        return reply.status(500).send({
          detail: `Failed to generate report: ${String(error)}`,
        });
      }

      // Save report record
      const reportId = await mongodb.createReport(
        projectId,
        userId,
        report_type,
        report_format,
        fileUrl
      );

      return {
        id: reportId,
        project_id: projectId,
        report_type,
        report_format,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      };
    }
  );
};

export default reportRoutes;
