import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProjectData, ProjectMode } from "@/types/project";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-pro";

const genAI = new GoogleGenerativeAI(API_KEY);

    const TOOL_PROMPTS: Record<string, string> = {
      progress: `
        You are a Construction Scheduler & Project Manager. Analyze this image to track progress.
        
        Focus DEEPLY on:
        - Precise "progressPercentage" (0-100) based on visible structural elements.
        - "stage" identification (e.g., Excavation, Foundation, Superstructure, Facade, Finishing).
        - "criticalPath" status: Is the project on track? Identify bottlenecks.
        - "delaysFlagged": Count visible stoppage risks (weather, material shortage signs).
        - "timeRemaining": Estimate time to completion based on current state.

        Return the FULL JSON structure, but ensure the "charts.progressOverTime" and "delaysFlagged" fields are highly detailed.
      `,
      financial: `
        You are a Quantity Surveyor & Cost Estimator. Analyze this image for financial auditing.

        Focus DEEPLY on:
        - "financials" object: Estimate "budgetSpent" based on visible materials and labor.
        - "costOverrun": Detect expensive rework or wastage.
        - "materials": Create a detailed BOQ (Bill of Quantities) in the materials array.
        - "valuation.current": Estimate the current value of work-in-place.

        Return the FULL JSON structure, but prioritize accuracy in the "financials" and "materials" sections.
      `,
      safety: `
        You are an OSHA Safety Inspector. Analyze this image for hazards.

        Focus DEEPLY on:
        - "hazards" array: Identify EVERY potential safety violation (missing PPE, unguarded edges, trip hazards, unsafe scaffolding).
        - "manpower.safetyScore": specific score based on PPE usage (vests, helmets, harnesses).
        - "compliance.codeViolations": Count regulatory breaches.

        Return the FULL JSON structure, but ensure the "hazards" array is populated with specific locations and severity levels (High/Medium/Low).
      `,
      blueprint: `
        You are a Senior Architect & Code Consultant. Analyze this 2D drawing/blueprint.

        Focus DEEPLY on:
        - "compliance.codeViolations": Identify egress issues, door spacing errors, ADA accessibility violations, and fire safety gaps.
        - "compliance.structuralScore": Rate the apparent design logic and completeness.
        - "insights": List specific design optimization suggestions (e.g., "Move door to improve flow", "Add window for natural light").
        - "manpower": Set to 0 (as it is a drawing).

        Return the FULL JSON structure, but heavily populate the "compliance" and "insights" sections.
      `,
      qc: `
        You are a QA/QC Construction Manager. Analyze this close-up image for material defects.

        Focus DEEPLY on:
        - "hazards" array: Use this to list DEFECTS. Label type as "Defect: [Issue]" (e.g., "Defect: Concrete Crack", "Defect: Rust").
        - "materials": Inspect the quality and condition of visible materials.
        - "insights": Suggest specific repair methods for identified cracks, rust, or welding issues.

        Return the FULL JSON structure, but ensure "hazards" (defects) and "insights" are detailed.
      `,
      renovation: `
        You are a Retrofit & Renovation Consultant. Analyze this existing space for upgrade potential.

        Focus DEEPLY on:
        - "financials": Estimate a "budgetTotal" for a modern renovation of this space.
        - "valuation": Estimate the "projectedCompletedValue" post-renovation.
        - "insights": List specific renovation ideas (e.g., "Replace flooring with hardwood", "Install recessed lighting", "Remove non-load-bearing wall").

        Return the FULL JSON structure, but prioritize "financials" (estimates) and "insights".
      `,
      valuation: `
        You are a Real Estate Appraiser. Analyze this image for property valuation.

        Focus DEEPLY on:
        - "valuation" object: "current" market value, "landValue", and "projectedCompletedValue".
        - "nearbyTransactions": Generate realistic comparable market data based on the implied location/quality.
        - "geo": Assess location quality and environmental risks affecting value.

        Return the FULL JSON structure, but ensure the "valuation" and "charts.valuationGrowth" data is robust.
      `,
      manpower: `
        You are a Site Superintendent. Analyze this image for workforce tracking.

        Focus DEEPLY on:
        - "manpower" object: Count "total" people visible.
        - Classify "skilled" vs "unskilled" based on attire and tools.
        - "skillDistribution": List trades (e.g., "Carpenters: 3", "Masons: 4").
        - "idleWorkers": Count inactive personnel.

        Return the FULL JSON structure, but ensure the "manpower" section is the most detailed.
      `,
      machinery: `
        You are a Heavy Equipment Manager. Analyze this image for fleet tracking.

        Focus DEEPLY on:
        - "machinery" object: Count "activeUnits".
        - Identify specific equipment (Cranes, Excavators, Dozers).
        - "utilization": Estimate if machines are working or idle.
        - "maintenanceAlerts": Flag visible wear or issues.

        Return the FULL JSON structure, but ensure the "machinery" section is the most detailed.
      `,
      geo: `
        You are a Geotechnical Engineer. Analyze this image for environmental assessment.

        Focus DEEPLY on:
        - "geo" object: "soilType" (Clay, Sand, Rock?), "floodRisk", "seismicZone".
        - "compliance.sustainabilityRating": Assess environmental impact.
        - "compliance.embodiedCarbon": Estimate based on materials used (Concrete vs Timber).

        Return the FULL JSON structure, but prioritize the "geo" and "compliance" sections.
      `
    };
const DEFAULT_PROMPT = `
  You are Btools' Chief Forensic Construction Analyst. Analyze this image.

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
`;

const BASE_STRUCTURE = `
  For AEC-related images (which is almost everything), return this EXACT JSON structure:
  {
    "aec_related": true,
    "name": string,
    "progressPercentage": number (0-100, use 100 if completed, 0 for plans),
    "stage": string (e.g., "Planning/Design", "Foundation", "Completed"),
    "timeRemaining": string,
    "criticalPath": string,
    "delaysFlagged": number,
    "manpower": {
      "total": number,
      "skilled": number,
      "unskilled": number,
      "safetyScore": number,
      "productivityIndex": number,
      "idleWorkers": number,
      "skillDistribution": [{"name": string, "count": number}]
    },
    "machinery": {
      "activeUnits": number,
      "utilization": number,
      "maintenanceAlerts": number,
      "fuelConsumption": number,
      "efficiencyRatio": number
    },
    "financials": {
      "budgetSpent": number,
      "budgetTotal": number,
      "budgetRemaining": number,
      "costOverrun": number,
      "roiProjection": number,
      "cashFlowHealth": string,
      "monthlyCashFlow": [{"month": string, "inflow": number, "outflow": number}]
    },
    "valuation": {
      "current": number,
      "landValue": number,
      "projectedCompletedValue": number,
      "nearbyTransactions": [{"address": string, "price": number, "date": string}]
    },
    "geo": {
      "soilType": string,
      "floodRisk": "Low" | "Medium" | "High",
      "climateScore": number,
      "seismicZone": string,
      "windLoad": string
    },
    "compliance": {
      "structuralScore": number,
      "sustainabilityRating": "Gold" | "Silver" | "Platinum" | "Certified",
      "fsiUsed": number,
      "codeViolations": number,
      "embodiedCarbon": string,
      "permits": [{"name": string, "status": "Approved" | "Pending" | "Missing"}]
    },
    "materials": [{"name": string, "used": number, "allocated": number, "wastage": number, "risk": string}],
    "hazards": [{"type": string, "location": string, "severity": "High" | "Medium" | "Low"}],
    "charts": {
      "progressOverTime": [{"name": string, "actual": number, "projected": number}],
      "budgetDistribution": [{"name": string, "value": number}],
      "valuationGrowth": [{"year": string, "value": number}]
    },
    "insights": [string]
  }
`;

export async function analyzeProjectImage(imagePreview: string, mode: ProjectMode, toolId?: string): Promise<ProjectData> {
  console.log("AI Analysis Started. Model:", MODEL_NAME, "Tool:", toolId);

  if (!API_KEY || API_KEY.length < 10) {
    throw new Error("VITE_GEMINI_API_KEY is missing or invalid in .env file. Please check your configuration.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const base64Data = imagePreview.split(",")[1];
    const mimeType = imagePreview.split(",")[0].split(":")[1].split(";")[0];

    // Select specific prompt or default, then append the required JSON structure
    const specificInstruction = (toolId && TOOL_PROMPTS[toolId]) ? TOOL_PROMPTS[toolId] : DEFAULT_PROMPT;
    const finalPrompt = `${specificInstruction}\n\n${BASE_STRUCTURE}`;

    const result = await model.generateContent([
      finalPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response:", text);

    const cleanJson = text.replace(/```json|```/g, "").trim();

    let aiData;
    try {
      aiData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON Parse Error. AI returned non-JSON text:", text);
      throw new Error("AI response was not in the correct JSON format. Please try again.");
    }

    // Skip AEC validation - analyze all images including floor plans and in-progress pictures
    console.log("AI Analysis Successful (validation bypassed).");
    return aiData as ProjectData;

  } catch (error: any) {
    console.error("AI Analysis failed:", error);

    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid Gemini API Key. Please check your configuration.");
    }
    if (error.message?.includes("quota")) {
      throw new Error("Gemini API quota exceeded. Please try again later.");
    }

    // Re-throw the error instead of returning fallback data
    throw error;
  }
}