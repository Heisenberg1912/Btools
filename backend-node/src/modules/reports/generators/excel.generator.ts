/**
 * Excel Report Generator using exceljs
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { config } from '../../../config/index.js';
import type { ProjectDocument, ProjectData } from '../../../db/mongodb.js';
import { WithId } from 'mongodb';

export async function generateExcel(
  project: WithId<ProjectDocument>,
  projectData: ProjectData | Record<string, unknown>,
  reportType: string
): Promise<string> {
  // Ensure upload directory exists
  const uploadDir = config.UPLOAD_DIR;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `report_${project._id.toString()}_${Date.now()}.xlsx`;
  const filepath = path.join(uploadDir, filename);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VitruviAI';
  workbook.created = new Date();

  // Overview Sheet
  const overviewSheet = workbook.addWorksheet('Overview');
  overviewSheet.columns = [
    { header: 'Property', key: 'property', width: 25 },
    { header: 'Value', key: 'value', width: 40 },
  ];

  overviewSheet.addRow({ property: 'Project Name', value: project.name });
  overviewSheet.addRow({ property: 'Location', value: project.location || 'N/A' });
  overviewSheet.addRow({ property: 'Status', value: project.status || 'Active' });
  overviewSheet.addRow({ property: 'Mode', value: project.mode });
  overviewSheet.addRow({ property: 'Report Type', value: reportType });
  overviewSheet.addRow({ property: 'Generated', value: new Date().toLocaleString() });

  const data = projectData as ProjectData;

  if (data && typeof data === 'object') {
    overviewSheet.addRow({});
    overviewSheet.addRow({ property: 'Progress', value: '' });
    overviewSheet.addRow({ property: 'Stage', value: data.stage || 'Unknown' });
    overviewSheet.addRow({ property: 'Progress %', value: `${data.progressPercentage || 0}%` });
    overviewSheet.addRow({ property: 'Time Remaining', value: data.timeRemaining || 'Unknown' });
    overviewSheet.addRow({ property: 'Delays Flagged', value: data.delaysFlagged || 0 });

    // Financials Sheet
    if (data.financials) {
      const finSheet = workbook.addWorksheet('Financials');
      finSheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      const fin = data.financials as Record<string, unknown>;
      finSheet.addRow({ metric: 'Budget Total', value: `$${(fin.budgetTotal as number || 0).toLocaleString()}` });
      finSheet.addRow({ metric: 'Budget Spent', value: `$${(fin.budgetSpent as number || 0).toLocaleString()}` });
      finSheet.addRow({ metric: 'Budget Remaining', value: `$${(fin.budgetRemaining as number || 0).toLocaleString()}` });
      finSheet.addRow({ metric: 'Cost Overrun', value: `${fin.costOverrun || 0}%` });
      finSheet.addRow({ metric: 'Projected Final Cost', value: `$${(fin.projectedFinalCost as number || 0).toLocaleString()}` });
      finSheet.addRow({ metric: 'Cash Flow Health', value: fin.cashFlowHealth || 'N/A' });
      finSheet.addRow({ metric: 'ROI Projection', value: `${fin.roiProjection || 0}%` });
    }

    // Manpower Sheet
    if (data.manpower) {
      const mpSheet = workbook.addWorksheet('Manpower');
      mpSheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 15 },
      ];

      const mp = data.manpower as Record<string, unknown>;
      mpSheet.addRow({ metric: 'Total Workers', value: mp.total || 0 });
      mpSheet.addRow({ metric: 'Skilled', value: mp.skilled || 0 });
      mpSheet.addRow({ metric: 'Unskilled', value: mp.unskilled || 0 });
      mpSheet.addRow({ metric: 'Safety Score', value: `${mp.safetyScore || 0}%` });
      mpSheet.addRow({ metric: 'Productivity Index', value: `${mp.productivityIndex || 0}%` });
      mpSheet.addRow({ metric: 'Idle Workers', value: mp.idleWorkers || 0 });
    }

    // Materials Sheet
    if (data.materials && Array.isArray(data.materials)) {
      const matSheet = workbook.addWorksheet('Materials');
      matSheet.columns = [
        { header: 'Material', key: 'name', width: 15 },
        { header: 'Allocated', key: 'allocated', width: 12 },
        { header: 'Used', key: 'used', width: 12 },
        { header: 'Wastage %', key: 'wastage', width: 12 },
        { header: 'Risk', key: 'risk', width: 10 },
      ];

      data.materials.forEach((mat: Record<string, unknown>) => {
        matSheet.addRow({
          name: mat.name,
          allocated: mat.allocated,
          used: mat.used,
          wastage: mat.wastage,
          risk: mat.risk,
        });
      });
    }

    // Compliance Sheet
    if (data.compliance) {
      const compSheet = workbook.addWorksheet('Compliance');
      compSheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      const comp = data.compliance as Record<string, unknown>;
      compSheet.addRow({ metric: 'Structural Score', value: `${comp.structuralScore || 0}%` });
      compSheet.addRow({ metric: 'FSI Used', value: comp.fsiUsed || 0 });
      compSheet.addRow({ metric: 'Sustainability Rating', value: comp.sustainabilityRating || 'N/A' });
      compSheet.addRow({ metric: 'Code Violations', value: comp.codeViolations || 0 });
      compSheet.addRow({ metric: 'Embodied Carbon', value: comp.embodiedCarbon || 'N/A' });
    }

    // Insights Sheet
    if (data.insights && Array.isArray(data.insights)) {
      const insSheet = workbook.addWorksheet('AI Insights');
      insSheet.columns = [
        { header: '#', key: 'num', width: 5 },
        { header: 'Insight', key: 'insight', width: 80 },
      ];

      data.insights.forEach((insight: string, index: number) => {
        insSheet.addRow({ num: index + 1, insight });
      });
    }
  }

  // Style headers
  workbook.worksheets.forEach(sheet => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  });

  await workbook.xlsx.writeFile(filepath);

  return `/uploads/${filename}`;
}
