export type ProjectMode = 'under-construction' | 'completed';

export interface ProjectData {
  // Core Identifiers
  id: string;
  name: string;
  location: string;
  lastUpdated: string;

  // Progress Intelligence
  stage: string;
  progressPercentage: number;
  timeRemaining: string;
  criticalPath: string;
  delaysFlagged: number;
  burnRate: number;

  // Manpower Analytics
  manpower: {
    total: number;
    skilled: number;
    unskilled: number;
    productivityIndex: number;
    safetyScore: number;
    skillDistribution: { name: string; count: number }[];
    idleWorkers: number;
  };

  // Machinery Analytics
  machinery: {
    utilization: number;
    activeUnits: number;
    maintenanceAlerts: number;
    fuelConsumption: number;
    efficiencyRatio: number;
  };

  // Material Tracking
  materials: {
    name: string;
    allocated: number;
    used: number;
    wastage: number;
    risk: 'Low' | 'Medium' | 'High';
  }[];

  // Financial Engine
  financials: {
    budgetTotal: number;
    budgetSpent: number;
    budgetRemaining: number;
    costOverrun: number;
    projectedFinalCost: number;
    cashFlowHealth: 'Positive' | 'Neutral' | 'Negative';
    roiProjection: number;
    monthlyCashFlow: { month: string; inflow: number; outflow: number }[];
  };

  // Valuation Intelligence
  valuation: {
    current: number;
    landValue: number;
    projectedCompletedValue: number;
    appreciationForecast: number;
    rentalYield: number;
    nearbyTransactions: { address: string; price: number; date: string }[];
  };

  // Architect & Compliance
  compliance: {
    structuralScore: number;
    fsiUsed: number;
    sustainabilityRating: 'Gold' | 'Silver' | 'Platinum' | 'Certified';
    codeViolations: number;
    embodiedCarbon: string;
    permits?: { name: string; status: 'Approved' | 'Pending' | 'Missing' | 'Rejected' }[];
  };

  // Safety Hazards (New)
  hazards?: {
    type: string;
    location: string;
    severity: 'High' | 'Medium' | 'Low';
    time?: string;
  }[];

  // Geo & Environmental
  geo: {
    soilType: string;
    floodRisk: 'Low' | 'Medium' | 'High';
    seismicZone: string;
    climateScore: number;
    groundwaterLevel: string;
    windLoad: string;
  };

  // Charts Data
  charts: {
    progressOverTime: { name: string; actual: number; projected: number }[];
    valuationGrowth: { year: string; value: number }[];
    budgetDistribution: { name: string; value: number }[];
  };

  insights: string[];
}
