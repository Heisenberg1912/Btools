import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Building, Calculator, DollarSign, Table as TableIcon, ArrowUpRight, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectData } from '@/types/project';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Props {
  data: ProjectData;
  isPaywalled: boolean;
}

export function FinancialsView({ data, isPaywalled }: Props) {
  const [roiAdjustment, setRoiAdjustment] = useState(0);
  const projectedRoi = (data.financials.roiProjection + roiAdjustment).toFixed(1);

  // Mock data for granular budget - in a real app this would come from the API
  const budgetItems = [
    { category: "Structure & Concrete", budget: 4500000, actual: 4200000, status: "Under Budget" },
    { category: "MEP Services", budget: 2100000, actual: 2350000, status: "Over Budget" },
    { category: "Finishing & Interiors", budget: 1800000, actual: 1200000, status: "On Track" },
    { category: "Site Preparation", budget: 500000, actual: 480000, status: "Completed" },
    { category: "Labor & Workforce", budget: 3200000, actual: 3100000, status: "On Track" },
  ];

  const blurClass = isPaywalled ? "blur-sm select-none pointer-events-none" : "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* AI Financial Summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
           <h4 className="font-semibold text-blue-900">AI Financial Forecast</h4>
           <p className="text-sm text-blue-700 mt-1 leading-relaxed">
             Project is currently <span className="font-bold text-green-600">3.2% under budget</span> overall. However, 
             <span className="font-bold text-red-600"> MEP costs</span> are trending 12% higher than estimates due to recent material price surges. 
             Projected ROI remains healthy at {data.financials.roiProjection}%.
           </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
           <TabsTrigger value="overview">Overview</TabsTrigger>
           <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
           <TabsTrigger value="budget">Budget Detail</TabsTrigger>
           <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                   <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                   <Wallet className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold tracking-tight">${(data.financials.budgetTotal / 1000000).toFixed(2)}M</div>
                <div className="flex justify-between text-xs mt-3 font-medium">
                   <span className="text-green-600 flex items-center"><ArrowUpRight className="h-3 w-3 mr-0.5" /> Spent: ${(data.financials.budgetSpent / 1000000).toFixed(2)}M</span>
                   <span className="text-slate-500">Rem: ${(data.financials.budgetRemaining / 1000000).toFixed(2)}M</span>
                </div>
                <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(data.financials.budgetSpent / data.financials.budgetTotal) * 100}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card>
               <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                   <p className="text-sm font-medium text-muted-foreground">Projected ROI</p>
                   <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-600">+{data.financials.roiProjection}%</div>
                <p className="text-xs text-muted-foreground mt-1">Based on current market rates</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                   <TrendingUp className="h-3 w-3" /> Market trending up 1.5% this qtr
                </div>
              </CardContent>
            </Card>

            <Card>
               <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                   <p className="text-sm font-medium text-muted-foreground">Cash Flow Health</p>
                   <ActivityIcon status={data.financials.cashFlowHealth} />
                </div>
                <div className="text-2xl font-bold">{data.financials.cashFlowHealth}</div>
                 <p className="text-xs text-muted-foreground mt-1">Last 3 months analysis</p>
                 <div className="mt-4 text-xs font-medium text-slate-500 flex justify-between items-center">
                    <span>Inflow: $1.2M</span>
                    <span className="h-4 w-px bg-slate-200" />
                    <span>Outflow: $0.9M</span>
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Distribution by cost center</CardDescription>
              </CardHeader>
              <CardContent className="w-full min-w-0 h-[300px] min-h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={data.charts.budgetDistribution}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {data.charts.budgetDistribution.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     />
                     <Legend verticalAlign="bottom" height={36} />
                   </PieChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
               <CardHeader>
                  <CardTitle>Valuation Growth</CardTitle>
                  <CardDescription>Project value over time</CardDescription>
               </CardHeader>
               <CardContent className="w-full min-w-0 h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={data.charts.valuationGrowth || []}>
                        <defs>
                           <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000000}M`} />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <div>
                 <CardTitle>Cash Flow Analysis</CardTitle>
                 <CardDescription>Monthly Inflow vs Outflow & Net Position</CardDescription>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" size="sm">Export CSV</Button>
               </div>
             </CardHeader>
             <CardContent className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={data.financials.monthlyCashFlow}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="month" />
                   <YAxis yAxisId="left" orientation="left" stroke="#64748b" />
                   <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                   <RechartsTooltip />
                   <Legend />
                   <Bar yAxisId="left" dataKey="inflow" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} barSize={20} />
                   <Bar yAxisId="left" dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} barSize={20} />
                   <Line yAxisId="right" type="monotone" dataKey="inflow" stroke="#3b82f6" strokeWidth={2} name="Net Trend" dot={false} />
                 </ComposedChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle>Line Item Budget</CardTitle>
                 <CardDescription>Detailed variance analysis by cost center</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                       <TableRow>
                          <TableHead>Cost Category</TableHead>
                          <TableHead className="text-right">Budgeted</TableHead>
                          <TableHead className="text-right">Actual Spent</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {budgetItems.map((item, i) => {
                          const variance = item.budget - item.actual;
                          const isNegative = variance < 0;
                          return (
                             <TableRow key={i}>
                                <TableCell className="font-medium">{item.category}</TableCell>
                                <TableCell className="text-right">${(item.budget / 1000).toLocaleString()}k</TableCell>
                                <TableCell className="text-right">${(item.actual / 1000).toLocaleString()}k</TableCell>
                                <TableCell className={`text-right ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                   {isNegative ? '-' : '+'}${(Math.abs(variance) / 1000).toLocaleString()}k
                                </TableCell>
                                <TableCell className="text-right">
                                   <Badge variant={item.status === 'Over Budget' ? 'destructive' : item.status === 'Completed' ? 'secondary' : 'outline'}>
                                      {item.status}
                                   </Badge>
                                </TableCell>
                             </TableRow>
                          )
                       })}
                    </TableBody>
                 </Table>
              </CardContent>
              <CardFooter className="justify-center border-t p-4">
                 <Button variant="ghost" className="text-sm text-muted-foreground">View All 142 Line Items</Button>
              </CardFooter>
           </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                 <CardHeader>
                    <CardTitle>ROI Calculator</CardTitle>
                    <CardDescription>Adjust variables to forecast returns</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex justify-between">
                          <label className="text-sm font-medium">Market Growth Rate (Annual)</label>
                          <span className="text-sm font-bold text-blue-600">{roiAdjustment > 0 ? '+' : ''}{roiAdjustment}%</span>
                       </div>
                       <Slider 
                          defaultValue={[0]} 
                          max={10} 
                          min={-5} 
                          step={0.5} 
                          onValueChange={(val) => setRoiAdjustment(val[0])}
                          className="py-4"
                       />
                       <p className="text-xs text-muted-foreground">Adjust expected annual market appreciation to see impact on final valuation.</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Current Valuation</span>
                          <span className="font-bold">${(data.valuation.current / 1000000).toFixed(2)}M</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Est. Completion Cost</span>
                          <span className="font-bold text-slate-500">${(data.financials.budgetRemaining / 1000000).toFixed(2)}M</span>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="bg-slate-900 text-white border-slate-800">
                 <CardHeader>
                    <CardTitle className="text-white">Projected Returns</CardTitle>
                    <CardDescription className="text-slate-400">Based on your adjustments</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="text-center py-8">
                       <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Net ROI</p>
                       <div className="text-6xl font-black text-green-400 flex items-center justify-center gap-2">
                          {projectedRoi}<span className="text-2xl">%</span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                       <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Base Case</p>
                          <p className="font-bold text-lg">{data.financials.roiProjection}%</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Optimistic Case</p>
                          <p className="font-bold text-lg text-green-400">{(data.financials.roiProjection + 2.5).toFixed(1)}%</p>
                       </div>
                    </div>
                    
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                       <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Investment Report
                    </Button>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      {/* Valuation Details (Paywalled) */}
      <div className="relative">
         {isPaywalled && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
               <div className="bg-background border shadow-lg rounded-full p-3 mb-2">
                 <Building className="h-5 w-5 text-primary" />
               </div>
               <p className="font-semibold text-sm mb-1">Valuation Intelligence</p>
               <Badge variant="secondary">Premium Feature</Badge>
            </div>
         )}
         
         <Card className={blurClass}>
            <CardHeader>
               <CardTitle>Comparative Market Analysis</CardTitle>
               <CardDescription>Nearby transactions affecting your valuation</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {data.valuation.nearbyTransactions.map((t, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                              <Building size={16} />
                           </div>
                           <div>
                              <p className="font-medium text-sm">{t.address}</p>
                              <p className="text-xs text-muted-foreground">{t.date}</p>
                           </div>
                        </div>
                        <span className="font-bold text-sm">${(t.price / 1000000).toFixed(2)}M</span>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function ActivityIcon({ status }: { status: string }) {
   if (status === 'Positive') return <TrendingUp className="h-4 w-4 text-green-500" />;
   if (status === 'Negative') return <TrendingDown className="h-4 w-4 text-red-500" />;
   return <TrendingUp className="h-4 w-4 text-yellow-500" />;
}
