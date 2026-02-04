/**
 * Projects routes - Port of Python routers/projects.py
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as mongodb from '../../db/mongodb.js';
import { requireAuth, checkScanLimit } from '../../middleware/auth.middleware.js';
import { aiService } from '../ai/ai.service.js';
import {
  projectCreateSchema,
  projectUpdateSchema,
  analysisRequestSchema,
  ProjectResponse,
  ProjectListResponse,
  AnalysisResponse,
} from './project.schemas.js';
import type { ProjectDocument } from '../../db/mongodb.js';
import { WithId } from 'mongodb';
import { z } from 'zod';

// Convert MongoDB project document to response format
function projectToResponse(project: WithId<ProjectDocument>): ProjectResponse {
  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description || '',
    location: project.location || '',
    mode: project.mode,
    status: project.status || 'active',
    created_at: project.created_at.toISOString(),
    updated_at: project.updated_at.toISOString(),
  };
}

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/projects - List all projects for current user
  app.get(
    '',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: z.object({
          page: z.string().optional().default('1').transform(Number),
          per_page: z.string().optional().default('10').transform(Number),
        }),
      },
    },
    async (request, reply) => {
      const { page, per_page } = request.query;
      const offset = (page - 1) * per_page;
      const userId = request.userId!;

      // Get total count
      const total = await mongodb.countUserProjects(userId);

      // Get paginated projects
      const projects = await mongodb.getUserProjects(userId, offset, per_page);

      const response: ProjectListResponse = {
        projects: projects.map(projectToResponse),
        total,
        page,
        per_page,
      };

      return response;
    }
  );

  // POST /api/projects - Create a new project
  app.post(
    '',
    {
      preHandler: [requireAuth],
      schema: {
        body: projectCreateSchema,
      },
    },
    async (request, reply) => {
      const { name, description, location, mode } = request.body;
      const userId = request.userId!;
      const subscription = request.subscription!;

      // Check project limit
      const projectCount = await mongodb.countUserProjects(userId);
      const maxProjects = subscription.max_projects || 1;

      if (projectCount >= maxProjects) {
        return reply.status(403).send({
          detail: `Project limit reached. Your plan allows ${maxProjects} projects.`,
        });
      }

      const projectId = await mongodb.createProject(userId, name, description, location, mode);

      if (!projectId) {
        return reply.status(500).send({
          detail: 'Failed to create project',
        });
      }

      const project = await mongodb.getProject(projectId);
      if (!project) {
        return reply.status(500).send({
          detail: 'Failed to retrieve created project',
        });
      }

      return reply.status(201).send(projectToResponse(project));
    }
  );

  // GET /api/projects/:projectId - Get project by ID
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

      return projectToResponse(project);
    }
  );

  // GET /api/projects/:projectId/data - Get full project data for dashboard
  app.get(
    '/:projectId/data',
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

      // If we have latest analysis data, return it
      if (project.project_data) {
        return project.project_data;
      }

      // Otherwise return default/empty data
      return aiService.getDefaultProjectData(project);
    }
  );

  // PUT /api/projects/:projectId - Update project
  app.put(
    '/:projectId',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
        body: projectUpdateSchema,
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const userId = request.userId!;
      const updates = request.body;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      const updated = await mongodb.updateProject(projectId, updates as Partial<ProjectDocument>);
      if (!updated) {
        return reply.status(500).send({
          detail: 'Failed to update project',
        });
      }

      const updatedProject = await mongodb.getProject(projectId);
      if (!updatedProject) {
        return reply.status(500).send({
          detail: 'Failed to retrieve updated project',
        });
      }

      return projectToResponse(updatedProject);
    }
  );

  // DELETE /api/projects/:projectId - Delete project
  app.delete(
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

      const deleted = await mongodb.deleteProject(projectId);
      if (!deleted) {
        return reply.status(500).send({
          detail: 'Failed to delete project',
        });
      }

      return reply.status(204).send();
    }
  );

  // POST /api/projects/:projectId/analyze - Analyze a construction image using AI
  app.post(
    '/:projectId/analyze',
    {
      preHandler: [checkScanLimit],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
        body: analysisRequestSchema,
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const { image_base64, mode } = request.body;
      const userId = request.userId!;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        console.log(`⚠️  Project ${projectId} not found or unauthorized`);
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      console.log(`📊 Starting analysis: "${project.name}" | Mode: ${mode}`);

      // Perform AI analysis
      const analysisResult = await aiService.analyzeImage(image_base64, mode, project);

      // Check if there was an error
      if (analysisResult.error) {
        console.log(`❌ Analysis failed: ${analysisResult.error}`);
        return reply.status(400).send({
          detail: analysisResult.error,
          is_valid: false,
          insights: analysisResult.insights,
        });
      }

      // Save and increment scan count for all successfully analyzed images
      const analysisData = {
        created_at: new Date(),
        stage: analysisResult.stage,
        progressPercentage: analysisResult.progressPercentage,
        confidence_score: analysisResult.confidence_score,
        insights: analysisResult.insights,
        project_data: analysisResult.project_data ?? undefined,
        raw_response: analysisResult.raw_response,
        is_valid: true,
      };

      // Add analysis to project
      await mongodb.addAnalysis(projectId, analysisData);

      // Update project with latest analysis data
      if (analysisResult.project_data) {
        await mongodb.updateProject(projectId, {
          project_data: analysisResult.project_data,
        } as Partial<ProjectDocument>);
      }

      // Increment scan count only for successful analysis
      await mongodb.incrementScanUsage(userId);

      // Store analysis in history for trend tracking (Pro feature)
      const previousAnalysis = await mongodb.getLatestAnalysis(projectId);
      const deltas = previousAnalysis ? {
        progress: analysisResult.progressPercentage - (previousAnalysis.snapshot.progressPercentage || 0),
        budget_spent: analysisResult.project_data?.financials?.budgetSpent
          ? (analysisResult.project_data.financials.budgetSpent - (previousAnalysis.snapshot.financials?.budgetSpent || 0))
          : undefined,
        workers: analysisResult.project_data?.manpower?.total
          ? (analysisResult.project_data.manpower.total - (previousAnalysis.snapshot.manpower?.total || 0))
          : undefined,
        safety_score: analysisResult.project_data?.manpower?.safetyScore
          ? (analysisResult.project_data.manpower.safetyScore - (previousAnalysis.snapshot.manpower?.safetyScore || 0))
          : undefined,
        delays: analysisResult.delaysFlagged - (previousAnalysis.snapshot.delaysFlagged || 0),
      } : undefined;

      const snapshot = {
        stage: analysisResult.stage,
        progressPercentage: analysisResult.progressPercentage,
        timeRemaining: analysisResult.timeRemaining,
        criticalPath: analysisResult.criticalPath,
        delaysFlagged: analysisResult.delaysFlagged,
        confidence_score: analysisResult.confidence_score,
        insights: analysisResult.insights,
        manpower: analysisResult.project_data?.manpower,
        machinery: analysisResult.project_data?.machinery,
        financials: analysisResult.project_data?.financials,
        project_data: (analysisResult.project_data ?? undefined) as unknown as Record<string, unknown> | undefined,
      };

      await mongodb.createAnalysisHistory(projectId, userId, snapshot, deltas);
      console.log(`💾 Analysis saved & scan count incremented`);

      const response: AnalysisResponse = {
        id: `analysis-${Date.now()}`,
        project_id: projectId,
        is_valid: true,
        stage_detected: analysisResult.stage,
        progress_detected: analysisResult.progressPercentage,
        confidence_score: analysisResult.confidence_score,
        insights: analysisResult.insights,
        project_data: (analysisResult.project_data ?? {}) as Record<string, unknown>,
        created_at: new Date().toISOString(),
      };

      return response;
    }
  );

  // GET /api/projects/:projectId/analyses - List analysis history for a project
  app.get(
    '/:projectId/analyses',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
        querystring: z.object({
          limit: z.string().optional().default('10').transform(Number),
        }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const { limit } = request.query;
      const userId = request.userId!;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      // Get analyses from project document
      const analyses = (project.analyses || []).slice(0, limit).map((analysis, index) => ({
        id: `analysis-${index}`,
        project_id: projectId,
        is_valid: analysis.is_valid ?? true,
        stage_detected: analysis.stage || null,
        progress_detected: analysis.progressPercentage || null,
        confidence_score: analysis.confidence_score || null,
        insights: analysis.insights || [],
        project_data: analysis.project_data || {},
        created_at: analysis.created_at?.toISOString() || new Date().toISOString(),
      }));

      return analyses;
    }
  );

  // GET /api/projects/:projectId/trends - Get historical trends (Pro feature)
  app.get(
    '/:projectId/trends',
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          projectId: z.string(),
        }),
        querystring: z.object({
          metric: z.enum(['progress', 'budget', 'manpower', 'safety', 'all']).optional().default('all'),
          limit: z.string().optional().default('30').transform(Number),
        }),
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const { metric, limit } = request.query;
      const userId = request.userId!;

      const project = await mongodb.getProject(projectId);

      if (!project || project.user_id.toString() !== userId) {
        return reply.status(404).send({
          detail: 'Project not found',
        });
      }

      // Get analysis history
      const history = await mongodb.getAnalysisHistory(projectId, limit);

      if (history.length === 0) {
        return {
          project_id: projectId,
          data_points: 0,
          message: 'No historical data available yet. Upload more analyses to see trends.',
          trends: [],
        };
      }

      // Build time-series data
      const trends = history.reverse().map((analysis) => ({
        date: analysis.analysis_date.toISOString(),
        progress: analysis.snapshot.progressPercentage,
        stage: analysis.snapshot.stage,
        budget_spent: analysis.snapshot.financials?.budgetSpent || 0,
        budget_total: analysis.snapshot.financials?.budgetTotal || 0,
        workers: analysis.snapshot.manpower?.total || 0,
        safety_score: analysis.snapshot.manpower?.safetyScore || 0,
        productivity: analysis.snapshot.manpower?.productivityIndex || 0,
        delays: analysis.snapshot.delaysFlagged || 0,
        confidence: analysis.snapshot.confidence_score,
        deltas: analysis.deltas || {},
      }));

      // Calculate velocity (progress per day)
      let velocity = 0;
      if (trends.length >= 2) {
        const first = trends[0];
        const last = trends[trends.length - 1];
        const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
        const progressDiff = last.progress - first.progress;
        velocity = daysDiff > 0 ? progressDiff / daysDiff : 0;
      }

      return {
        project_id: projectId,
        data_points: trends.length,
        velocity: Number(velocity.toFixed(2)),
        velocity_unit: '% per day',
        trends: metric === 'all' ? trends : trends.map((t) => ({
          date: t.date,
          [metric]: t[metric as keyof typeof t],
        })),
      };
    }
  );

  // GET /api/projects/:projectId/forecast - Predict project outcomes (Pro feature)
  app.get(
    '/:projectId/forecast',
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

      // Get recent history (last 10 analyses)
      const history = await mongodb.getAnalysisHistory(projectId, 10);

      if (history.length < 2) {
        return reply.status(400).send({
          detail: 'Insufficient data for forecasting. Need at least 2 analyses.',
        });
      }

      // Linear regression for progress forecasting
      const data = history.reverse().map((h, idx) => ({
        x: idx,
        progress: h.snapshot.progressPercentage,
        budget: h.snapshot.financials?.budgetSpent || 0,
      }));

      const n = data.length;
      const sumX = data.reduce((sum, d) => sum + d.x, 0);
      const sumY = data.reduce((sum, d) => sum + d.progress, 0);
      const sumXY = data.reduce((sum, d) => sum + d.x * d.progress, 0);
      const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Predict completion (when progress = 100%)
      const stepsTo100 = slope > 0 ? (100 - intercept) / slope : null;
      const daysTo100 = stepsTo100 !== null ? Math.ceil(stepsTo100 * 7) : null; // Assuming weekly analyses

      // Budget forecast (simple linear extrapolation)
      const currentBudget = data[data.length - 1].budget;
      const currentProgress = data[data.length - 1].progress;
      const projectedFinalBudget = currentProgress > 0 ? (currentBudget / currentProgress) * 100 : 0;

      // Risk assessment
      const recentVelocity = data.length >= 3 ? data[data.length - 1].progress - data[data.length - 3].progress : 0;
      const riskLevel = recentVelocity < 5 ? 'high' : recentVelocity < 10 ? 'medium' : 'low';

      return {
        project_id: projectId,
        forecast: {
          completion_date_estimate: daysTo100 ? `${daysTo100} days from latest analysis` : 'Unable to estimate',
          completion_confidence: daysTo100 ? (slope > 0.5 ? 'high' : slope > 0.2 ? 'medium' : 'low') : 'insufficient data',
          final_budget_projection: Number(projectedFinalBudget.toFixed(2)),
          budget_overrun_risk: currentProgress > 0 && (currentBudget / currentProgress) > 1 ? 'Yes' : 'No',
          risk_level: riskLevel,
          recommendations: [
            recentVelocity < 5 ? 'Project velocity is slowing. Consider increasing resources.' : null,
            projectedFinalBudget > 110 ? 'Budget overrun projected. Review cost controls.' : null,
            riskLevel === 'high' ? 'High risk detected. Schedule review meeting with stakeholders.' : null,
          ].filter(Boolean),
        },
        based_on: `${history.length} historical analyses`,
      };
    }
  );
};

export default projectRoutes;
