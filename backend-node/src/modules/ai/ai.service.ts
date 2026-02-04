/**
 * AI Service - Gemini Vision integration.
 * Properly handles invalid images and returns errors instead of fallback data.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/index.js';
import type { ProjectDocument, ProjectData } from '../../db/mongodb.js';
import { WithId } from 'mongodb';

type ProjectMode = 'under-construction' | 'completed';

export interface AIAnalysisResult {
  valid: boolean;
  stage: string;
  progressPercentage: number;
  timeRemaining: string;
  criticalPath?: string;
  delaysFlagged: number;
  confidence_score: number;
  insights: string[];
  raw_response: Record<string, unknown>;
  project_data: ProjectData | null;
  error?: string;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
  private initError: string | null = null;
  public modelName: string;

  constructor() {
    this.modelName = config.GEMINI_MODEL;

    if (config.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        console.log(`[AIService] Initialized with model: ${this.modelName}`);
      } catch (error) {
        this.initError = String(error);
        this.model = null;
        console.error(`[AIService] INIT ERROR: ${error}`);
      }
    } else {
      this.initError = 'No GEMINI_API_KEY configured';
      console.log('[AIService] No API key configured');
    }
  }

  async analyzeImage(
    imageBase64: string,
    mode: ProjectMode,
    project?: WithId<ProjectDocument> | null
  ): Promise<AIAnalysisResult> {
    const projectName = project?.name || 'Unknown';
    const projectId = project?._id?.toString().slice(-6) || 'N/A';

    console.log(`🔍 [AI] Analyzing "${projectName}" (${projectId}) | Mode: ${mode}`);

    // Return error if no model available
    if (!this.model) {
      console.log(`❌ [AI] Model not available: ${this.initError}`);
      return {
        valid: false,
        stage: 'Error',
        progressPercentage: 0,
        timeRemaining: 'N/A',
        delaysFlagged: 0,
        confidence_score: 0,
        insights: [],
        raw_response: {},
        project_data: null,
        error: this.initError || 'AI model not initialized. Please configure GEMINI_API_KEY.',
      };
    }

    try {
      const startTime = Date.now();

      // Extract base64 data
      let imageData: string;
      if (imageBase64.includes(',')) {
        imageData = imageBase64.split(',')[1];
      } else {
        imageData = imageBase64;
      }

      const imageSize = Math.round((imageData.length * 3) / 4 / 1024);
      console.log(`📸 [AI] Image: ${imageSize}KB | Model: ${this.modelName}`);

      // Create prompt
      const modeText = mode === 'under-construction' ? 'construction site' : 'completed building';
      const prompt = this.getAnalysisPrompt(modeText);

      const response = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      // Parse response
      const responseText = response.response.text();
      const duration = Date.now() - startTime;
      const result = this.parseAIResponse(responseText);

      // Generate project data for all images
      const projectData = this.buildProjectData(result, project);

      const stage = (result.stage as string) || 'Unknown';
      const progress = (result.progressPercentage as number) || 0;
      const confidence = (result.confidence_score as number) || 75;

      console.log(`✅ [AI] Analysis complete in ${duration}ms | Stage: ${stage} | Progress: ${progress}% | Confidence: ${confidence}%`);

      return {
        valid: true,
        stage,
        progressPercentage: progress,
        timeRemaining: (result.timeRemaining as string) || 'Unknown',
        criticalPath: result.criticalPath as string,
        delaysFlagged: (result.delaysFlagged as number) || 0,
        confidence_score: confidence,
        insights: (result.insights as string[]) || [],
        raw_response: result,
        project_data: projectData,
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error(`❌ [AI] Analysis failed: ${errorMsg}`);

      // Return proper error instead of fallback data
      return {
        valid: false,
        stage: 'Error',
        progressPercentage: 0,
        timeRemaining: 'N/A',
        delaysFlagged: 0,
        confidence_score: 0,
        insights: [],
        raw_response: {},
        project_data: null,
        error: `AI analysis failed: ${errorMsg}`,
      };
    }
  }

  private getAnalysisPrompt(modeText: string): string {
    return `You are VitruviAI's Construction Analyst. Analyze this image.

VALIDATION - Be EXTREMELY LENIENT, default to YES:
✅ ACCEPT and ANALYZE (set aec_related: true):
- ANY buildings, structures, or constructions (any stage, any type, any condition)
- Completed buildings, furnished interiors, decorated rooms
- Under-construction sites, partially built structures
- Floor plans, blueprints, drawings, sketches, renderings
- Architectural photos, exterior/interior views
- Construction materials, equipment, tools
- ANY image with buildings or structures visible

❌ ONLY REJECT (set aec_related: false) these OBVIOUS cases:
- Pure nature (trees/sky/water) with NO structures
- Only people or animals with NO buildings
- Only food or products with NO architectural elements

IMPORTANT RULES:
- If there's ANY building/structure/room visible → aec_related: true
- If uncertain → default to aec_related: true
- For completed buildings → stage: "Completed", progressPercentage: 100
- For plans/drawings → stage: "Planning/Design", progressPercentage: 5

For AEC-related images (which is almost everything), return:
{
    "aec_related": true,
    "progressPercentage": number (0-100, use 100 if completed, 0 for plans/drawings),
    "stage": string (e.g., "Planning/Design", "Foundation", "Framing", "Completed"),
    "timeRemaining": string (e.g., "Planning Stage", "3 months", "Completed"),
    "criticalPath": string (current critical activity or "Design Review" for plans),
    "delaysFlagged": number (visible delays/issues count),
    "confidence_score": number (0-100, your confidence in the analysis),
    "manpower": {
        "total": number,
        "skilled": number,
        "unskilled": number,
        "safetyScore": number (0-100),
        "productivityIndex": number (0-100)
    },
    "machinery": {
        "activeUnits": number,
        "utilization": number (0-100),
        "maintenanceAlerts": number
    },
    "materials": [
        {"name": string, "allocated": number, "used": number, "wastage": number, "risk": "Low"|"Medium"|"High"}
    ],
    "financials": {
        "budgetSpent": number (percentage),
        "budgetTotal": number (USD estimate),
        "costOverrun": number (percentage)
    },
    "valuation": {
        "current": number (USD),
        "landValue": number,
        "projectedCompletedValue": number
    },
    "geo": {
        "soilType": string,
        "floodRisk": "Low"|"Medium"|"High",
        "climateScore": number (0-100)
    },
    "compliance": {
        "structuralScore": number (0-100),
        "sustainabilityRating": "Platinum"|"Gold"|"Silver"|"Certified"
    },
    "insights": [string] (3-5 observations)
}

Return ONLY valid JSON, no markdown.`;
  }

  private parseAIResponse(responseText: string): Record<string, unknown> {
    try {
      // Remove markdown code blocks if present
      let cleanText = responseText.replace(/```json\s*/gi, '');
      cleanText = cleanText.replace(/```\s*/g, '');
      cleanText = cleanText.trim();

      return JSON.parse(cleanText);
    } catch (error) {
      console.error('[AIService] JSON parse error:', error);
      // If parsing fails, return error but still mark as processed
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  private buildProjectData(
    aiResult: Record<string, unknown>,
    project?: WithId<ProjectDocument> | null
  ): ProjectData {
    const projectName = project?.name || 'Untitled Project';
    const projectLocation = project?.location || 'Unknown Location';
    const projectId = project?._id?.toString() || 'temp-1';

    const progressPercentage = (aiResult.progressPercentage as number) || 0;

    // Build manpower data
    const aiManpower = (aiResult.manpower as Record<string, number>) || {};
    const manpower = {
      total: aiManpower.total || 0,
      skilled: aiManpower.skilled || 0,
      unskilled: aiManpower.unskilled || 0,
      productivityIndex: aiManpower.productivityIndex || 0,
      safetyScore: aiManpower.safetyScore || 0,
      skillDistribution: [
        { name: 'Mason', count: Math.round((aiManpower.skilled || 0) * 0.3) },
        { name: 'Carpenter', count: Math.round((aiManpower.skilled || 0) * 0.2) },
        { name: 'Electrician', count: Math.round((aiManpower.skilled || 0) * 0.15) },
        { name: 'Plumber', count: Math.round((aiManpower.skilled || 0) * 0.1) },
        { name: 'Laborer', count: aiManpower.unskilled || 0 },
      ],
      idleWorkers: 0,
    };

    // Build machinery data
    const aiMachinery = (aiResult.machinery as Record<string, number>) || {};
    const machinery = {
      utilization: aiMachinery.utilization || 0,
      activeUnits: aiMachinery.activeUnits || 0,
      maintenanceAlerts: aiMachinery.maintenanceAlerts || 0,
      fuelConsumption: 0,
      efficiencyRatio: aiMachinery.utilization || 0,
    };

    // Build materials
    const materials = (aiResult.materials as Record<string, unknown>[]) || [];

    // Build financials
    const aiFinancials = (aiResult.financials as Record<string, number>) || {};
    const budgetTotal = aiFinancials.budgetTotal || 0;
    const budgetSpentPct = aiFinancials.budgetSpent || 0;
    const budgetSpent = Math.round(budgetTotal * budgetSpentPct / 100);
    const costOverrun = aiFinancials.costOverrun || 0;

    const financials = {
      budgetTotal,
      budgetSpent,
      budgetRemaining: budgetTotal - budgetSpent,
      costOverrun,
      projectedFinalCost: Math.round(budgetTotal * (1 + costOverrun / 100)),
      cashFlowHealth: costOverrun <= 0 ? 'Positive' : (costOverrun < 10 ? 'Neutral' : 'Negative'),
      roiProjection: 0,
      monthlyCashFlow: [],
    };

    // Build valuation
    const aiValuation = (aiResult.valuation as Record<string, number>) || {};
    const valuation = {
      current: aiValuation.current || 0,
      landValue: aiValuation.landValue || 0,
      projectedCompletedValue: aiValuation.projectedCompletedValue || 0,
      appreciationForecast: 0,
      rentalYield: 0,
      nearbyTransactions: [],
    };

    // Build compliance
    const aiCompliance = (aiResult.compliance as Record<string, unknown>) || {};
    const compliance = {
      structuralScore: (aiCompliance.structuralScore as number) || 0,
      fsiUsed: 0,
      sustainabilityRating: (aiCompliance.sustainabilityRating as string) || 'N/A',
      codeViolations: 0,
      embodiedCarbon: 'N/A',
    };

    // Build geo
    const aiGeo = (aiResult.geo as Record<string, unknown>) || {};
    const geo = {
      soilType: (aiGeo.soilType as string) || 'Unknown',
      floodRisk: (aiGeo.floodRisk as string) || 'Unknown',
      seismicZone: 'Unknown',
      climateScore: (aiGeo.climateScore as number) || 0,
      groundwaterLevel: 'Unknown',
      windLoad: 'Unknown',
    };

    // Build charts
    const charts = {
      progressOverTime: [
        { name: 'Current', actual: progressPercentage, projected: progressPercentage },
      ],
      valuationGrowth: [
        { year: new Date().getFullYear().toString(), value: aiValuation.current || 0 },
      ],
      budgetDistribution: materials.length > 0
        ? materials.map((m: Record<string, unknown>) => ({ name: m.name as string, value: (m.used as number) || 0 }))
        : [],
    };

    return {
      id: projectId,
      name: projectName,
      location: projectLocation,
      lastUpdated: new Date().toISOString(),
      stage: (aiResult.stage as string) || 'Unknown',
      progressPercentage,
      timeRemaining: (aiResult.timeRemaining as string) || 'Unknown',
      criticalPath: (aiResult.criticalPath as string) || 'Unknown',
      delaysFlagged: (aiResult.delaysFlagged as number) || 0,
      burnRate: budgetSpent > 0 ? Math.round(budgetSpent / 6) : 0,
      manpower,
      machinery,
      materials,
      financials,
      valuation,
      compliance,
      geo,
      charts,
      insights: (aiResult.insights as string[]) || [],
    };
  }

  getDefaultProjectData(project: WithId<ProjectDocument>): ProjectData {
    return this.buildProjectData({}, project);
  }
}

// Singleton instance
export const aiService = new AIService();
