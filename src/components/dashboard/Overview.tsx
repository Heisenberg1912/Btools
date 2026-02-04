import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';
import { 
  DollarSign, Activity, TrendingUp, AlertTriangle, Users, 
  Truck, MapPin, FileText, Lock, Clock, Sun, CheckCircle2, UserCircle2, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectData } from '@/types/project';

interface DashboardProps {
  data: ProjectData;
  isPaywalled: boolean;
}

export function DashboardOverview({ data, isPaywalled }: DashboardProps) {
  const milestones = [
    { name: 'Planning', status: 'completed' },
    { name: 'Foundation', status: 'completed' },
    { name: 'Structure', status: 'in-progress' },
    { name: 'MEP', status: 'pending' },
    { name: 'Finishing', status: 'pending' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Context Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="md:col-span-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0">
            <CardContent className="p-6 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-bold mb-1">Project Command Center</h2>
                  <p className="text-blue-100 opacity-90">
                     Active Stage: <span className="font-bold text-white">{data.stage}</span> • Critical Path: On Schedule
                  </p>
               </div>
               <div className="hidden md:flex gap-6 text-right">
                  <div>
                     <p className="text-blue-200 text-xs uppercase tracking-wider">Next Milestone</p>
                     <p className="font-bold text-lg">L3 Slab Casting</p>
                  </div>
                  <div>
                     <p className="text-blue-200 text-xs uppercase tracking-wider">Est. Completion</p>
                     <p className="font-bold text-lg">Oct 15, 2026</p>
                  </div>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-white border-blue-100 shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center h-full">
               <div className="flex items-center gap-3 mb-2">
                  <Sun className="text-orange-500 h-8 w-8" />
                  <div>
                     <p className="text-2xl font-bold text-slate-900">24°C</p>
                     <p className="text-xs text-muted-foreground">Sunny • UV Index 4</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" /> Updated 2m ago
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Project Valuation" 
          value={`$${(data.valuation.current / 1000000).toFixed(2)}M`} 
          sub={`+$${(data.valuation.projectedCompletedValue / 1000000).toFixed(1)}M projected`}
          icon={<DollarSign className="h-4 w-4 text-blue-600" />} 
        />
        <StatCard 
          title="Progress" 
          value={`${data.progressPercentage}%`} 
          sub={`Stage: ${data.stage}`} 
          icon={<Activity className="h-4 w-4 text-green-600" />} 
        />
        <StatCard 
          title="Cost Spent" 
          value={`$${(data.financials.budgetSpent / 1000000).toFixed(2)}M`} 
          sub={`${((data.financials.budgetSpent / data.financials.budgetTotal) * 100).toFixed(1)}% of budget`} 
          icon={<TrendingUp className="h-4 w-4 text-orange-600" />} 
        />
        <StatCard 
          title="Risks Detected" 
          value={data.delaysFlagged.toString()} 
          sub="Critical delays flagged" 
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />} 
          alert
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Timeline & Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Milestone Timeline */}
          <Card>
             <CardHeader className="pb-4">
                <CardTitle className="text-base">Project Milestones</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="relative pt-2 pb-6">
                   <div className="absolute top-[15px] left-0 w-full h-1 bg-slate-100 rounded-full" />
                   <div className="relative flex justify-between">
                      {milestones.map((m, i) => (
                         <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`h-8 w-8 rounded-full border-4 flex items-center justify-center bg-white ${
                               m.status === 'completed' ? 'border-green-500 text-green-600' :
                               m.status === 'in-progress' ? 'border-blue-600 text-blue-600' :
                               'border-slate-200 text-slate-300'
                            }`}>
                               {m.status === 'completed' ? <CheckCircle2 size={14} /> : 
                                m.status === 'in-progress' ? <Activity size={14} /> : 
                                <span className="h-2 w-2 rounded-full bg-slate-200" />}
                            </div>
                            <span className={`text-xs font-medium ${m.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{m.name}</span>
                         </div>
                      ))}
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Velocity (S-Curve)</CardTitle>
              <CardDescription>Actual vs Projected completion over time</CardDescription>
            </CardHeader>
            <CardContent className="w-full min-w-0 h-[320px] min-h-[320px]">
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.charts.progressOverTime}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" name="Actual Progress" dataKey="actual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" />
                  <Area type="monotone" name="Planned Baseline" dataKey="projected" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>          </Card>

           {/* Insights List */}
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <div className="p-1 bg-purple-100 rounded text-purple-600"><Activity size={16} /></div>
                 AI Insights Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.insights.map((insight, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="h-2 w-2 mt-2 rounded-full bg-purple-500 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Details (1/3 width) */}
        <div className="space-y-6">
           
           {/* Recent Activity */}
           <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Live Feed</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                 {[
                    { text: 'New drone scan processed', time: '12m ago', icon: <CheckCircle2 size={16} className="text-green-500" /> },
                    { text: 'Safety violation detected in Zone B', time: '45m ago', icon: <AlertTriangle size={16} className="text-red-500" /> },
                    { text: 'Valuation report generated', time: '2h ago', icon: <FileText size={16} className="text-blue-500" /> },
                    { text: 'Meeting scheduled with Contractor', time: '4h ago', icon: <Calendar size={16} className="text-slate-500" /> },
                 ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                       <div className="mt-0.5">{item.icon}</div>
                       <div>
                          <p className="text-sm font-medium">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                       </div>
                    </div>
                 ))}
              </CardContent>
           </Card>

          {/* Manpower & Machinery */}
          <Card>
            <CardHeader><CardTitle>Resource Snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><Users className="h-4 w-4"/> Manpower</span>
                  <span className="font-bold">{data.manpower.total} On Site</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="text-xs text-muted-foreground flex justify-between">
                   <span>{data.manpower.skilled} Skilled</span>
                   <span>{data.manpower.unskilled} Unskilled</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><Truck className="h-4 w-4"/> Machinery</span>
                  <span className="font-bold">{data.machinery.activeUnits} Active</span>
                </div>
                <Progress value={data.machinery.utilization} className="h-2" />
                <p className="text-xs text-muted-foreground">{data.machinery.utilization}% Utilization</p>
              </div>
            </CardContent>
          </Card>

          {/* Team Presence */}
          <Card>
             <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Active Team</CardTitle></CardHeader>
             <CardContent>
                <div className="flex -space-x-2 overflow-hidden mb-3">
                   {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="inline-block border-2 border-background h-8 w-8">
                         <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                         <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                   ))}
                   <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500 border-2 border-background">
                      +3
                   </div>
                </div>
                <p className="text-xs text-muted-foreground">3 engineers and 1 architect viewing</p>
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, alert }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${alert ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
          {sub}
        </p>
      </CardContent>
    </Card>
  )
}

