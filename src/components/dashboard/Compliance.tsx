import { 
  ShieldCheck, Leaf, Globe, Wind, Move, FileCheck, Map, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectData } from '@/types/project';

interface Props {
  data: ProjectData;
  isPaywalled: boolean;
}

export function ComplianceView({ data, isPaywalled }: Props) {
  const blurClass = isPaywalled ? "blur-sm select-none" : "";
  
  // Mock tracking data
  const permits = data.compliance.permits || [
    { name: 'Structural Approval', status: 'Approved' },
    { name: 'Fire Safety NOC', status: 'Approved' },
    { name: 'Environmental Clearance', status: 'Pending' },
    { name: 'Water & Sewage', status: 'Approved' },
    { name: 'Electrical Sanction', status: 'Missing' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Main Map Column */}
         <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
               <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                     <CardTitle className="flex items-center gap-2">
                        <Globe className="text-indigo-600" /> Geospatial Intelligence
                     </CardTitle>
                     <CardDescription>Zone overlays, flood plains, and seismic data</CardDescription>
                  </div>
                  <div className="flex gap-2">
                     <Badge variant="outline">Satellite</Badge>
                     <Badge className="bg-indigo-600">Terrain</Badge>
                  </div>
               </CardHeader>
               
               {/* Simulated Map View */}
               <div className={`relative aspect-video bg-slate-100 border-t border-b ${blurClass}`}>
                  <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4241,37.78,14.25,0/600x600?access_token=Pk.xxx')] bg-cover opacity-50 grayscale" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="bg-white/90 p-4 rounded-lg shadow-lg text-center backdrop-blur-sm">
                        <Map className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
                        <p className="font-bold text-slate-800">Interactive GIS Map</p>
                        <p className="text-xs text-slate-500 mb-2">Overlaying Zone R-3 (Residential) Boundaries</p>
                        {isPaywalled && <Button size="sm" className="mt-2">Unlock Premium Map</Button>}
                     </div>
                  </div>
                  
                  {/* Floating Map Controls */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                     <div className="bg-white p-2 rounded shadow text-xs font-bold">Zoom: 14x</div>
                     <div className="bg-white p-2 rounded shadow text-xs font-bold">Layer: Risk</div>
                  </div>
               </div>

               <CardContent className={`grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 ${blurClass}`}>
                  <GeoCard icon={<Move />} label="Soil Type" value={data.geo.soilType} />
                  <GeoCard icon={<Wind />} label="Flood Risk" value={data.geo.floodRisk} alert={data.geo.floodRisk === 'High'} />
                  <GeoCard icon={<ActivityIcon />} label="Seismic Zone" value={data.geo.seismicZone} />
                  <GeoCard icon={<Wind />} label="Wind Load" value={data.geo.windLoad} />
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Leaf className="text-green-500" /> Environmental Impact
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center gap-6">
                     <div className="h-24 w-24 rounded-full border-8 border-green-100 flex items-center justify-center relative">
                        <div className="text-center">
                           <span className="block text-2xl font-bold text-green-700">B+</span>
                           <span className="text-[10px] uppercase text-green-600">Rating</span>
                        </div>
                     </div>
                     <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                           <div className="flex justify-between text-sm">
                              <span>Embodied Carbon Target</span>
                              <span className="text-green-600 font-bold">{data.compliance.embodiedCarbon}</span>
                           </div>
                           <Progress value={65} className="h-2 bg-green-100" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                           Project is currently <span className="text-green-600 font-medium">12% below</span> the regional carbon baseline for this building type.
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Right Sidebar: Compliance & Permits */}
         <div className="space-y-6">
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <ShieldCheck className="text-blue-600" /> Compliance Audit
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span>Structural Integrity Score</span>
                        <span className="font-bold">{data.compliance.structuralScore}/100</span>
                     </div>
                     <Progress value={data.compliance.structuralScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <p className="text-xs text-muted-foreground">FSI Utilization</p>
                        <p className="text-xl font-bold">{data.compliance.fsiUsed}%</p>
                     </div>
                     <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <p className="text-xs text-muted-foreground">Violations</p>
                        <p className={`text-xl font-bold ${data.compliance.codeViolations > 0 ? 'text-red-500' : 'text-green-500'}`}>
                           {data.compliance.codeViolations}
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <FileCheck className="text-slate-600" /> Permit Tracker
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                  {permits.map((p, i) => (
                     <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                        <span className="text-sm font-medium">{p.name}</span>
                        <Badge 
                           variant="secondary" 
                           className={`${
                              p.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                              p.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                           }`}
                        >
                           {p.status}
                        </Badge>
                     </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4 text-xs">Upload New Permit</Button>
               </CardContent>
            </Card>
         </div>

      </div>
    </div>
  );
}

function GeoCard({ icon, label, value, alert }: any) {
   return (
      <div className={`p-4 rounded-lg border flex flex-col items-center text-center space-y-2 ${alert ? 'bg-red-50 border-red-200' : 'bg-background'}`}>
         <div className="text-muted-foreground">{icon}</div>
         <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`font-semibold ${alert ? 'text-red-600' : ''}`}>{value}</p>
         </div>
      </div>
   )
}

function ActivityIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
}
