import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Box, 
  Maximize2, 
  AlertTriangle, 
  Wind, 
  Thermometer, 
  Droplets,
  Activity,
  MoreVertical,
  Play
} from 'lucide-react';

export function SiteMonitorView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Site Monitor</h2>
          <p className="text-muted-foreground">Real-time jobsite surveillance and digital twin status.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2">
             <Activity className="h-4 w-4 text-green-500" /> System Healthy
           </Button>
           <Button>Connect New Device</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Environment Stats */}
        <Card>
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Site Conditions</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                       <Thermometer className="h-5 w-5" />
                    </div>
                    <div>
                       <div className="text-2xl font-bold">24°C</div>
                       <div className="text-xs text-muted-foreground">Temperature</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                       <Wind className="h-5 w-5" />
                    </div>
                    <div>
                       <div className="text-2xl font-bold">12km/h</div>
                       <div className="text-xs text-muted-foreground">Wind Speed</div>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                    <Droplets className="h-5 w-5" />
                 </div>
                 <div>
                    <div className="text-2xl font-bold">45%</div>
                    <div className="text-xs text-muted-foreground">Humidity</div>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Safety Status */}
        <Card>
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Safety AI Detection</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="font-medium">PPE Compliance</span>
                    </div>
                    <span className="text-green-600 font-bold">98%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[98%]" />
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-yellow-500" />
                       <span className="font-medium">Zone Intrusion</span>
                    </div>
                    <span className="text-yellow-600 font-bold">1 Alert</span>
                 </div>
                 
                 <p className="text-xs text-muted-foreground pt-1">
                    Last incident: Worker in Zone B without vest (2h ago)
                 </p>
              </div>
           </CardContent>
        </Card>

        {/* Device Status */}
        <Card>
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected Devices</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
               {[
                  { name: 'Crane Cam 01', status: 'Online', bat: '100%' },
                  { name: 'Gate Cam 04', status: 'Online', bat: '92%' },
                  { name: 'Drone Unit A', status: 'Charging', bat: '15%' },
               ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                     <span className="font-medium">{d.name}</span>
                     <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {d.status}
                        </span>
                        <span className="text-muted-foreground text-xs">{d.bat}</span>
                     </div>
                  </div>
               ))}
           </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live-feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="live-feed">Live Camera Feeds</TabsTrigger>
          <TabsTrigger value="digital-twin">3D Digital Twin</TabsTrigger>
        </TabsList>
        
        <TabsContent value="live-feed" className="space-y-4 mt-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop", 
                "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1590644365607-1c5a2e9a3a75?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?q=80&w=800&auto=format&fit=crop"
              ].map((src, idx) => {
                const cam = idx + 1;
                return (
                <motion.div 
                  key={cam}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: cam * 0.1 }}
                  className="group relative aspect-video bg-black rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200"
                >
                   {/* Placeholder for Video Feed */}
                   <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="h-16 w-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                   </div>
                   
                   {/* Overlay UI */}
                   <div className="absolute top-3 left-3 flex gap-2 z-20">
                      <Badge variant="destructive" className="animate-pulse px-1.5 py-0 text-[10px] uppercase shadow-sm">Live</Badge>
                      <span className="text-white text-xs font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded shadow-sm">CAM-0{cam}</span>
                   </div>
                   
                   <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <span className="text-white text-xs font-medium">Sector {['North', 'South', 'East', 'West'][cam-1]} Gate • 1080p</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20">
                         <Maximize2 className="h-4 w-4" />
                      </Button>
                   </div>
                   
                   {/* Real Image Feed */}
                   <img 
                      src={src} 
                      alt={`Camera Feed ${cam}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   />
                </motion.div>
              )})}
           </div>
        </TabsContent>
        
        <TabsContent value="digital-twin" className="mt-4">
           <div className="relative aspect-[16/9] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                 <Button size="icon" variant="ghost" className="text-white h-8 w-8 hover:bg-white/20"><Box className="h-4 w-4" /></Button>
                 <Button size="icon" variant="ghost" className="text-white h-8 w-8 hover:bg-white/20"><Maximize2 className="h-4 w-4" /></Button>
              </div>
              
              <div className="absolute bottom-4 left-4 z-10 bg-black/60 p-4 rounded-lg backdrop-blur-md text-white max-w-sm">
                 <h4 className="font-bold flex items-center gap-2">
                    <Box className="h-4 w-4 text-blue-400" /> BIM Model v2.4
                 </h4>
                 <p className="text-xs text-slate-300 mt-1">
                    Synchronization active. Overlaying current progress from LIDAR scan (2h ago).
                 </p>
                 <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/50">Structure</Badge>
                    <Badge variant="outline" className="text-xs text-green-300 border-green-500/50">MEP</Badge>
                 </div>
              </div>

              {/* Placeholder Content for 3D View */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center space-y-4">
                    <div className="relative">
                       <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                       <Box className="h-24 w-24 text-blue-600/50 relative z-10" />
                    </div>
                    <p className="text-slate-500 font-mono text-sm">Interactive 3D View Loading...</p>
                 </div>
              </div>
              
              {/* Grid Lines Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
