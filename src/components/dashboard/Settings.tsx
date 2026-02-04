import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Radio, Smartphone } from 'lucide-react';

export function SettingsView() {
   const [alerts, setAlerts] = useState({
      whatsapp: true,
      sms: false,
      drone: false,
      chatbot: true,
   });

   return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" /> "Go Big" Features
               </CardTitle>
               <CardDescription>Enable advanced integrations and notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                     <Label className="text-base">WhatsApp Progress Alerts</Label>
                     <p className="text-sm text-muted-foreground">Receive daily site photos and progress summaries via WhatsApp.</p>
                  </div>
                  <Switch checked={alerts.whatsapp} onCheckedChange={(c: boolean) => setAlerts(p => ({...p, whatsapp: c}))} />
               </div>
               
               <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                     <Label className="text-base">Critical SMS Alerts</Label>
                     <p className="text-sm text-muted-foreground">Instant SMS for delays &gt; 48 hours or material shortages.</p>
                  </div>
                  <Switch checked={alerts.sms} onCheckedChange={(c: boolean) => setAlerts(p => ({...p, sms: c}))} />
               </div>

               <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                     <Label className="text-base">Drone Mapping Integration</Label>
                     <p className="text-sm text-muted-foreground">Connect DJI/Autel drones for automated aerial photogrammetry.</p>
                  </div>
                  <Switch checked={alerts.drone} onCheckedChange={(c: boolean) => setAlerts(p => ({...p, drone: c}))} />
               </div>

               <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                     <Label className="text-base">AI Chatbot Assistant</Label>
                     <p className="text-sm text-muted-foreground">Enable "Btools Bot" for project Q&A overlay.</p>
                  </div>
                  <Switch checked={alerts.chatbot} onCheckedChange={(c: boolean) => setAlerts(p => ({...p, chatbot: c}))} />
               </div>
            </CardContent>
         </Card>


         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" /> External Integrations
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                     <p className="font-medium">Bank API (Loan Eligibility)</p>
                     <p className="text-xs text-muted-foreground">Disconnected</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
               </div>
               <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                     <p className="font-medium">Government Approval Tracker</p>
                     <p className="text-xs text-muted-foreground">Region: IN-MH (Maharashtra)</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
               </div>
            </CardContent>
         </Card>
      </div>
   )
}
