/**
 * Portfolio Service
 * Aggregate analytics across multiple projects
 */

import * as mongodb from '../../db/mongodb.js';
import type { WithId } from 'mongodb';
import type { ProjectDocument } from '../../db/mongodb.js';

export interface PortfolioSummary {
  total_projects: number;
  total_value: string;
  avg_progress: number;
  projects_on_track: number;
  projects_at_risk: number;
  projects_delayed: number;
  total_budget_spent: string;
  portfolio_roi: string;
  total_workers: number;
  avg_safety_score: number;
}

export interface ProjectComparison {
  project_id: string;
  name: string;
  progress: number;
  budget_spent_pct: number;
  safety_score: number;
  risk_level: 'low' | 'medium' | 'high';
  status: 'on_track' | 'at_risk' | 'delayed';
}

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const projects = await mongodb.getUserProjects(userId);

  if (projects.length === 0) {
    return {
      total_projects: 0,
      total_value: '$0',
      avg_progress: 0,
      projects_on_track: 0,
      projects_at_risk: 0,
      projects_delayed: 0,
      total_budget_spent: '$0',
      portfolio_roi: '0%',
      total_workers: 0,
      avg_safety_score: 0,
    };
  }

  let totalValue = 0;
  let totalProgress = 0;
  let totalBudgetSpent = 0;
  let totalWorkers = 0;
  let totalSafetyScore = 0;
  let projectsOnTrack = 0;
  let projectsAtRisk = 0;
  let projectsDelayed = 0;
  let safetyScoreCount = 0;

  for (const project of projects) {
    const data = project.project_data;
    if (!data) continue;

    // Valuation
    if (data.valuation?.current) {
      totalValue += data.valuation.current;
    }

    // Progress
    if (typeof data.progressPercentage === 'number') {
      totalProgress += data.progressPercentage;

      // Status classification
      if (data.delaysFlagged && data.delaysFlagged > 2) {
        projectsDelayed++;
      } else if (data.progressPercentage < 50 && (data.financials?.budgetSpent || 0) > 60) {
        projectsAtRisk++;
      } else {
        projectsOnTrack++;
      }
    }

    // Budget
    if (data.financials?.budgetTotal && data.financials?.budgetSpent) {
      const spent = (data.financials.budgetTotal * data.financials.budgetSpent) / 100;
      totalBudgetSpent += spent;
    }

    // Workers
    if (data.manpower?.total) {
      totalWorkers += data.manpower.total;
    }

    // Safety
    if (data.manpower?.safetyScore) {
      totalSafetyScore += data.manpower.safetyScore;
      safetyScoreCount++;
    }
  }

  const avgProgress = projects.length > 0 ? totalProgress / projects.length : 0;
  const avgSafetyScore = safetyScoreCount > 0 ? totalSafetyScore / safetyScoreCount : 0;
  const portfolioROI = totalBudgetSpent > 0 ? ((totalValue - totalBudgetSpent) / totalBudgetSpent) * 100 : 0;

  return {
    total_projects: projects.length,
    total_value: `$${(totalValue / 1000000).toFixed(1)}M`,
    avg_progress: Number(avgProgress.toFixed(1)),
    projects_on_track: projectsOnTrack,
    projects_at_risk: projectsAtRisk,
    projects_delayed: projectsDelayed,
    total_budget_spent: `$${(totalBudgetSpent / 1000000).toFixed(1)}M`,
    portfolio_roi: `${portfolioROI.toFixed(1)}%`,
    total_workers: totalWorkers,
    avg_safety_score: Number(avgSafetyScore.toFixed(0)),
  };
}

export async function compareProjects(userId: string, projectIds?: string[]): Promise<ProjectComparison[]> {
  let projects = await mongodb.getUserProjects(userId);

  // Filter to specific projects if requested
  if (projectIds && projectIds.length > 0) {
    projects = projects.filter((p) => projectIds.includes(p._id.toString()));
  }

  return projects.map((project) => {
    const data = project.project_data;

    const progress = data?.progressPercentage || 0;
    const budgetSpent = data?.financials?.budgetSpent || 0;
    const safetyScore = data?.manpower?.safetyScore || 0;
    const delays = data?.delaysFlagged || 0;

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (delays > 3 || safetyScore < 70 || (progress < 50 && budgetSpent > 60)) {
      riskLevel = 'high';
    } else if (delays > 1 || safetyScore < 85 || (progress < 70 && budgetSpent > 80)) {
      riskLevel = 'medium';
    }

    // Status determination
    let status: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
    if (delays > 2) {
      status = 'delayed';
    } else if (riskLevel === 'high' || riskLevel === 'medium') {
      status = 'at_risk';
    }

    return {
      project_id: project._id.toString(),
      name: project.name,
      progress,
      budget_spent_pct: budgetSpent,
      safety_score: safetyScore,
      risk_level: riskLevel,
      status,
    };
  });
}

export async function getTopRiskProjects(userId: string, limit: number = 5): Promise<ProjectComparison[]> {
  const comparisons = await compareProjects(userId);

  // Sort by risk level (high first, then medium, then low)
  const riskOrder = { high: 3, medium: 2, low: 1 };
  comparisons.sort((a, b) => riskOrder[b.risk_level] - riskOrder[a.risk_level]);

  return comparisons.slice(0, limit);
}
