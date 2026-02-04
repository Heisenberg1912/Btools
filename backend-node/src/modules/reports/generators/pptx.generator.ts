/**
 * PowerPoint Report Generator using pptxgenjs
 */

// @ts-ignore - pptxgenjs types issue
import PptxGenJSModule from 'pptxgenjs';
const PptxGenJS = PptxGenJSModule.default || PptxGenJSModule;
import fs from 'fs';
import path from 'path';
import { config } from '../../../config/index.js';
import type { ProjectDocument, ProjectData } from '../../../db/mongodb.js';
import { WithId } from 'mongodb';

export async function generatePPTX(
  project: WithId<ProjectDocument>,
  projectData: ProjectData | Record<string, unknown>,
  reportType: string
): Promise<string> {
  // Ensure upload directory exists
  const uploadDir = config.UPLOAD_DIR;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `report_${project._id.toString()}_${Date.now()}.pptx`;
  const filepath = path.join(uploadDir, filename);

  const pptx = new PptxGenJS();
  pptx.author = 'VitruviAI';
  pptx.title = `${project.name} - Analysis Report`;
  pptx.subject = 'Construction Analysis Report';

  const data = projectData as ProjectData;

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText('VitruviAI', {
    x: 0.5,
    y: 0.5,
    w: '90%',
    fontSize: 36,
    bold: true,
    color: '363636',
  });
  titleSlide.addText('Construction Analysis Report', {
    x: 0.5,
    y: 1.5,
    w: '90%',
    fontSize: 24,
    color: '666666',
  });
  titleSlide.addText(project.name, {
    x: 0.5,
    y: 2.5,
    w: '90%',
    fontSize: 20,
    bold: true,
    color: '363636',
  });
  titleSlide.addText(`Location: ${project.location || 'N/A'}`, {
    x: 0.5,
    y: 3.2,
    w: '90%',
    fontSize: 14,
    color: '666666',
  });
  titleSlide.addText(`Generated: ${new Date().toLocaleString()}`, {
    x: 0.5,
    y: 4.5,
    w: '90%',
    fontSize: 12,
    color: '999999',
  });

  if (data && typeof data === 'object') {
    // Progress Slide
    const progressSlide = pptx.addSlide();
    progressSlide.addText('Progress Overview', {
      x: 0.5,
      y: 0.3,
      w: '90%',
      fontSize: 28,
      bold: true,
      color: '363636',
    });

    const progressRows = [
      ['Metric', 'Value'],
      ['Stage', data.stage || 'Unknown'],
      ['Progress', `${data.progressPercentage || 0}%`],
      ['Time Remaining', data.timeRemaining || 'Unknown'],
      ['Critical Path', data.criticalPath || 'N/A'],
      ['Delays Flagged', String(data.delaysFlagged || 0)],
    ] as any;

    progressSlide.addTable(progressRows, {
      x: 0.5,
      y: 1.0,
      w: 9,
      colW: [3, 6],
      fontSize: 14,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F9F9F9' },
    });

    // Financials Slide
    if (data.financials) {
      const finSlide = pptx.addSlide();
      finSlide.addText('Financial Summary', {
        x: 0.5,
        y: 0.3,
        w: '90%',
        fontSize: 28,
        bold: true,
        color: '363636',
      });

      const fin = data.financials as Record<string, unknown>;
      const finRows = [
        ['Metric', 'Value'],
        ['Budget Total', `$${(fin.budgetTotal as number || 0).toLocaleString()}`],
        ['Budget Spent', `$${(fin.budgetSpent as number || 0).toLocaleString()}`],
        ['Budget Remaining', `$${(fin.budgetRemaining as number || 0).toLocaleString()}`],
        ['Cost Overrun', `${fin.costOverrun || 0}%`],
        ['Cash Flow Health', String(fin.cashFlowHealth || 'N/A')],
      ] as any;

      finSlide.addTable(finRows, {
        x: 0.5,
        y: 1.0,
        w: 9,
        colW: [4, 5],
        fontSize: 14,
        border: { pt: 1, color: 'CCCCCC' },
        fill: { color: 'F9F9F9' },
      });
    }

    // Manpower Slide
    if (data.manpower) {
      const mpSlide = pptx.addSlide();
      mpSlide.addText('Manpower', {
        x: 0.5,
        y: 0.3,
        w: '90%',
        fontSize: 28,
        bold: true,
        color: '363636',
      });

      const mp = data.manpower as Record<string, unknown>;
      const mpRows = [
        ['Metric', 'Value'],
        ['Total Workers', String(mp.total || 0)],
        ['Skilled', String(mp.skilled || 0)],
        ['Unskilled', String(mp.unskilled || 0)],
        ['Safety Score', `${mp.safetyScore || 0}%`],
        ['Productivity Index', `${mp.productivityIndex || 0}%`],
      ] as any;

      mpSlide.addTable(mpRows, {
        x: 0.5,
        y: 1.0,
        w: 9,
        colW: [4, 5],
        fontSize: 14,
        border: { pt: 1, color: 'CCCCCC' },
        fill: { color: 'F9F9F9' },
      });
    }

    // Compliance Slide
    if (data.compliance) {
      const compSlide = pptx.addSlide();
      compSlide.addText('Compliance & Safety', {
        x: 0.5,
        y: 0.3,
        w: '90%',
        fontSize: 28,
        bold: true,
        color: '363636',
      });

      const comp = data.compliance as Record<string, unknown>;
      const compRows = [
        ['Metric', 'Value'],
        ['Structural Score', `${comp.structuralScore || 0}%`],
        ['Sustainability Rating', String(comp.sustainabilityRating || 'N/A')],
        ['Code Violations', String(comp.codeViolations || 0)],
        ['Embodied Carbon', String(comp.embodiedCarbon || 'N/A')],
      ] as any;

      compSlide.addTable(compRows, {
        x: 0.5,
        y: 1.0,
        w: 9,
        colW: [4, 5],
        fontSize: 14,
        border: { pt: 1, color: 'CCCCCC' },
        fill: { color: 'F9F9F9' },
      });
    }

    // Insights Slide
    if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
      const insSlide = pptx.addSlide();
      insSlide.addText('AI Insights', {
        x: 0.5,
        y: 0.3,
        w: '90%',
        fontSize: 28,
        bold: true,
        color: '363636',
      });

      data.insights.slice(0, 5).forEach((insight: string, index: number) => {
        insSlide.addText(`${index + 1}. ${insight}`, {
          x: 0.5,
          y: 1.0 + index * 0.6,
          w: '90%',
          fontSize: 14,
          color: '363636',
          bullet: false,
        });
      });
    }
  }

  // Thank You Slide
  const endSlide = pptx.addSlide();
  endSlide.addText('Thank You', {
    x: 0.5,
    y: 2,
    w: '90%',
    fontSize: 36,
    bold: true,
    color: '363636',
    align: 'center',
  });
  endSlide.addText('Powered by VitruviAI\nAI-Powered Construction Intelligence', {
    x: 0.5,
    y: 3.5,
    w: '90%',
    fontSize: 16,
    color: '666666',
    align: 'center',
  });

  await pptx.writeFile({ fileName: filepath });

  return `/uploads/${filename}`;
}
