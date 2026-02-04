import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Users, Truck, Package, AlertTriangle, Hammer, HardHat, TrendingUp, ClipboardCheck, Layers, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProjectData } from '@/types/project';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

interface Props {
  data: ProjectData;
  isPaywalled: boolean;
  defaultTab?: string;
}

export function AnalyticsView({ data, defaultTab }: Props) {
  // Use real hazards from data if available, otherwise fallback to empty or mock for demo
  const hazards = data.hazards || [
    { type: "Missing PPE", location: "Zone B - Scaffolding", severity: "High", time: "10:42 AM" },
    { type: "Unsecured Material", location: "Ground Floor Entry", severity: "Medium", time: "09:15 AM" },
    { type: "Blocked Walkway", location: "Zone A - Corridor", severity: "Low", time: "08:30 AM" },
  ];

  const hazardCount = hazards.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* AI Construction Insight */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mt-1">
          <Eye className="h-5 w-5" />
        </div>
        <div>
           <h4 className="font-semibold text-purple-900">Site Vision Analysis</h4>
           <p className="text-sm text-purple-700 mt-1 leading-relaxed">
             Analysis completed. Detected <span className="font-bold">{data.manpower.total} active workers</span> ({data.manpower.skilled} skilled, {data.manpower.unskilled} unskilled). 
             Identified <span className="font-bold text-red-600">{hazardCount} alerts</span> requiring attention. 
             Structural progress is estimated at <span className="font-bold">{data.progressPercentage}%</span>, stage: <span className="font-bold">{data.stage}</span>.
           </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab || "materials"} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
          <TabsTrigger value="materials">Materials & Takeoff</TabsTrigger>
          <TabsTrigger value="safety">Safety & Hazards</TabsTrigger>
          <TabsTrigger value="manpower">Labor Force</TabsTrigger>
          <TabsTrigger value="machinery">Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                 <CardHeader>
                    <CardTitle>AI Material Takeoff</CardTitle>
                    <CardDescription>Automated quantity estimation from site visuals</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Table>
                       <TableHeader>
                          <TableRow>
                             <TableHead>Material</TableHead>
                             <TableHead className="text-right">Detected</TableHead>
                             <TableHead className="text-right">Allocated</TableHead>
                             <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {data.materials.map((mat, i) => (
                             <TableRow key={i}>
                                <TableCell className="font-medium">{mat.name}</TableCell>
                                <TableCell className="text-right">{mat.used}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{mat.allocated}</TableCell>
                                <TableCell className="text-right">
                                   <Badge variant={mat.risk === 'High' ? 'destructive' : 'outline'} className="text-[10px]">
                                      {mat.risk} Risk
                                   </Badge>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>

              <Card>
                 <CardHeader>
                    <CardTitle>Inventory Consumption</CardTitle>
                    <CardDescription>Burn rate analysis</CardDescription>
                 </CardHeader>
                 <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart layout="vertical" data={data.materials} margin={{ left: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <RechartsTooltip />
                          <Bar dataKey="used" fill="#3b82f6" name="Used" radius={[0, 4, 4, 0]} barSize={20} />
                          <Bar dataKey="allocated" fill="#e2e8f0" name="Total" radius={[0, 4, 4, 0]} barSize={20} />
                       </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-red-50 border-red-100">
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                       <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                       <div className="text-2xl font-bold text-red-700">3</div>
                       <div className="text-sm text-red-600 font-medium">Open Hazards</div>
                    </div>
                 </CardContent>
              </Card>
              <Card>
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                       <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                       <div className="text-2xl font-bold text-green-700">98.5%</div>
                       <div className="text-sm text-muted-foreground">Compliance Score</div>
                    </div>
                 </CardContent>
              </Card>
              <Card>
                 <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                       <HardHat className="h-6 w-6" />
                    </div>
                    <div>
                       <div className="text-2xl font-bold text-blue-700">14/14</div>
                       <div className="text-sm text-muted-foreground">Workers Vested</div>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <Card>
              <CardHeader>
                 <CardTitle>Hazard Log</CardTitle>
                 <CardDescription>AI-detected safety violations from latest scan</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                       <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Hazard Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Time Detected</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {hazards.map((h, i) => (
                          <TableRow key={i}>
                             <TableCell>
                                <Badge variant={h.severity === 'High' ? 'destructive' : h.severity === 'Medium' ? 'default' : 'secondary'}>
                                   {h.severity}
                                </Badge>
                             </TableCell>
                             <TableCell className="font-medium">{h.type}</TableCell>
                             <TableCell>{h.location}</TableCell>
                             <TableCell className="text-muted-foreground">{h.time}</TableCell>
                             <TableCell className="text-right">
                                <Button size="sm" variant="outline">View Cam</Button>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="manpower" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard title="Productivity Index" value={data.manpower.productivityIndex} suffix="/100" icon={<TrendingUp className="text-green-500"/>} />
              <StatsCard title="Safety Score" value={data.manpower.safetyScore} suffix="Safe" icon={<HardHat className="text-green-500"/>} />
              <StatsCard title="Idle Workers" value={data.manpower.idleWorkers} suffix="Today" icon={<Users className="text-orange-500"/>} />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                 <CardHeader><CardTitle>Skill Distribution Heatmap</CardTitle></CardHeader>
                 <CardContent className="w-full min-w-0 h-[300px] min-h-[300px]">
                    <div className="w-full h-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                          <Pie data={data.manpower.skillDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                             {data.manpower.skillDistribution.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <RechartsTooltip />
                                                 </PieChart>
                                              </ResponsiveContainer>
                                           </div>
                                        </CardContent>              </Card>
              <Card>
                 <CardHeader><CardTitle>Labor Productivity Trend</CardTitle></CardHeader>
                 <CardContent className="h-[300px] w-full min-w-0 flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <div className="text-center">
                       <Layers className="h-10 w-10 mx-auto mb-2 opacity-20" />
                       <p>Shift analysis data requires 24h cycle</p>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="machinery" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard title="Utilization Rate" value={data.machinery.utilization} suffix="%" icon={<Truck className="text-blue-500"/>} />
              <StatsCard title="Active Units" value={data.machinery.activeUnits} suffix="Units" icon={<Hammer className="text-slate-500"/>} />
              <StatsCard title="Fuel Consumption" value={data.machinery.fuelConsumption} suffix="L/Day" icon={<Package className="text-red-500"/>} />
           </div>
           <Card>
              <CardHeader><CardTitle>Equipment Efficiency</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                       <span>Overall Efficiency Ratio</span>
                       <span className="font-bold">{data.machinery.efficiencyRatio}%</span>
                    </div>
                    <Progress value={data.machinery.efficiencyRatio} className="h-2" />
                 </div>
                 {data.machinery.maintenanceAlerts > 0 && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                       <AlertTriangle size={20} />
                       <span className="text-sm font-medium">{data.machinery.maintenanceAlerts} machine(s) require urgent maintenance.</span>
                    </div>
                 )}
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ title, value, suffix, icon }: any) {
   return (
      <Card>
         <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  <h3 className="text-2xl font-bold mt-2">{value} <span className="text-sm font-normal text-muted-foreground">{suffix}</span></h3>
               </div>
               <div className="p-2 bg-muted rounded-full">{icon}</div>
            </div>
         </CardContent>
      </Card>
   )
}


