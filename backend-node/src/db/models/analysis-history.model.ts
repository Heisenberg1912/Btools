/**
 * Analysis History Model
 * Stores historical snapshots of AI analyses for trend tracking and forecasting
 */

import { ObjectId } from 'mongodb';

export interface AnalysisSnapshot {
  // Progress metrics
  stage: string;
  progressPercentage: number;
  timeRemaining: string;
  criticalPath?: string;
  delaysFlagged: number;
  confidence_score: number;
  insights: string[];

  // Manpower
  manpower?: {
    total: number;
    skilled: number;
    unskilled: number;
    productivityIndex: number;
    safetyScore: number;
    idleWorkers?: number;
  };

  // Machinery
  machinery?: {
    activeUnits: number;
    utilization: number;
    maintenanceAlerts: number;
  };

  // Financials
  financials?: {
    budgetTotal: number;
    budgetSpent: number;
    budgetRemaining: number;
    costOverrun: number;
    burnRate?: number;
  };

  // Full project data (optional, for detailed analysis)
  project_data?: Record<string, unknown>;
}

export interface AnalysisDelta {
  progress?: number; // Change in progress percentage
  budget_spent?: number; // Change in budget spent percentage
  workers?: number; // Change in worker count
  safety_score?: number; // Change in safety score
  delays?: number; // Change in delays flagged
  productivity?: number; // Change in productivity index
}

export interface AnalysisHistoryDocument {
  _id?: ObjectId;
  project_id: ObjectId;
  user_id: ObjectId;
  analysis_date: Date;
  snapshot: AnalysisSnapshot;
  deltas?: AnalysisDelta; // Changes from previous analysis
  created_at: Date;
}

export const ANALYSIS_HISTORY_COLLECTION = 'analyses_history';
