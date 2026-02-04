import React from 'react';
import { 
  BarChart3, 
  Building, 
  Shield, 
  Hammer, 
  Camera, 
  FileText, 
  HardHat, 
  Zap, 
  Globe,
  ArrowRight,
  Lock,
  Scroll,
  Microscope,
  PaintBucket
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ToolsGridProps {
  onToolSelect: (toolId: string) => void;
}

const tools = [
  {
    id: 'progress',
    title: 'Progress Tracking',
    description: 'Compare scans to schedule. Detect delays & critical path issues.',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100/50',
    borderColor: 'group-hover:border-blue-500/50',
    shadowColor: 'group-hover:shadow-blue-500/10',
    gradient: 'from-blue-500/5 to-transparent'
  },
  {
    id: 'financial',
    title: 'Financial Audit',
    description: 'Cost-to-complete analysis & budget variance reports.',
    icon: Building,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100/50',
    borderColor: 'group-hover:border-emerald-500/50',
    shadowColor: 'group-hover:shadow-emerald-500/10',
    gradient: 'from-emerald-500/5 to-transparent'
  },
  {
    id: 'safety',
    title: 'Safety Inspector',
    description: 'Identify hazards, PPE violations, and compliance risks.',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-100/50',
    borderColor: 'group-hover:border-red-500/50',
    shadowColor: 'group-hover:shadow-red-500/10',
    gradient: 'from-red-500/5 to-transparent'
  },
  {
    id: 'blueprint',
    title: 'Blueprint Analyzer',
    description: 'Verify 2D drawings for code compliance & spatial errors.',
    icon: Scroll,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100/50',
    borderColor: 'group-hover:border-pink-500/50',
    shadowColor: 'group-hover:shadow-pink-500/10',
    gradient: 'from-pink-500/5 to-transparent'
  },
  {
    id: 'valuation',
    title: 'Valuation Report',
    description: 'Bank-grade property appraisal & land value estimation.',
    icon: FileText,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100/50',
    borderColor: 'group-hover:border-violet-500/50',
    shadowColor: 'group-hover:shadow-violet-500/10',
    gradient: 'from-violet-500/5 to-transparent'
  },
  {
    id: 'qc',
    title: 'Quality Control',
    description: 'Detect material defects, cracks, and welding issues.',
    icon: Microscope,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100/50',
    borderColor: 'group-hover:border-yellow-500/50',
    shadowColor: 'group-hover:shadow-yellow-500/10',
    gradient: 'from-yellow-500/5 to-transparent'
  },
  {
    id: 'manpower',
    title: 'Manpower Counter',
    description: 'Count active workers, track trades, and measure productivity.',
    icon: HardHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100/50',
    borderColor: 'group-hover:border-orange-500/50',
    shadowColor: 'group-hover:shadow-orange-500/10',
    gradient: 'from-orange-500/5 to-transparent'
  },
  {
    id: 'machinery',
    title: 'Equipment Tracker',
    description: 'Monitor heavy machinery utilization and idle time.',
    icon: Hammer,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100/50',
    borderColor: 'group-hover:border-slate-500/50',
    shadowColor: 'group-hover:shadow-slate-500/10',
    gradient: 'from-slate-500/5 to-transparent'
  },
  {
    id: 'renovation',
    title: 'Renovation Planner',
    description: 'AI-generated retrofit ideas & ROI estimation.',
    icon: PaintBucket,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100/50',
    borderColor: 'group-hover:border-teal-500/50',
    shadowColor: 'group-hover:shadow-teal-500/10',
    gradient: 'from-teal-500/5 to-transparent'
  },
  {
    id: 'geo',
    title: 'Geo Intelligence',
    description: 'Soil analysis, flood risk, and environmental compliance.',
    icon: Globe,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100/50',
    borderColor: 'group-hover:border-cyan-500/50',
    shadowColor: 'group-hover:shadow-cyan-500/10',
    gradient: 'from-cyan-500/5 to-transparent'
  },
  {
    id: 'monitor',
    title: 'Site Monitor',
    description: 'Connect live CCTV feeds for real-time 24/7 surveillance.',
    icon: Camera,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100/50',
    borderColor: 'group-hover:border-indigo-500/50',
    shadowColor: 'group-hover:shadow-indigo-500/10',
    gradient: 'from-indigo-500/5 to-transparent'
  },
];

export function ToolsGrid({ onToolSelect }: ToolsGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <section className="container mx-auto px-4 py-12" id="tools-grid">
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {tools.map((tool) => (
          <motion.div key={tool.id} variants={item}>
            <div 
              className={`group relative h-full bg-white rounded-2xl border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tool.borderColor} ${tool.shadowColor} overflow-hidden cursor-pointer`}
              onClick={() => onToolSelect(tool.id)}
            >
              {/* Subtle Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${tool.bgColor} ${tool.color}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className={`h-5 w-5 ${tool.color}`} />
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-slate-900 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-grow">
                  {tool.description}
                </p>
                
                {/* Simulated 'Tag' or Status */}
                <div className="mt-auto pt-4 border-t border-slate-100 w-full flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">AI Model Ready</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* 'Coming Soon' / Custom Tool Placeholder */}
        <motion.div variants={item}>
            <div className="h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center transition-colors hover:border-slate-300 hover:bg-slate-100/50 cursor-not-allowed group relative overflow-hidden">
               {/* diagonal stripes pattern */}
               <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%,#000_100%)] bg-[size:20px_20px]" />
               
               <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lock className="h-5 w-5 text-slate-400" />
               </div>
               <h3 className="font-bold text-lg text-slate-700 mb-1">Custom Agent</h3>
               <p className="text-sm text-slate-500">Train your own model</p>
               <span className="mt-3 inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Enterprise
               </span>
            </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
