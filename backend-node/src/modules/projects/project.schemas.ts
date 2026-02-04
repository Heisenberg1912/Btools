import { z } from 'zod';

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().default(''),
  location: z.string().default(''),
  mode: z.enum(['under-construction', 'completed']).default('under-construction'),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  mode: z.enum(['under-construction', 'completed']).optional(),
  status: z.string().optional(),
});

export const analysisRequestSchema = z.object({
  image_base64: z.string().min(1, 'Image is required'),
  mode: z.enum(['under-construction', 'completed']).default('under-construction'),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  location: string;
  mode: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface AnalysisResponse {
  id: string;
  project_id: string;
  is_valid: boolean;
  stage_detected: string | null;
  progress_detected: number | null;
  confidence_score: number | null;
  insights: string[];
  project_data: Record<string, unknown>;
  created_at: string;
}
