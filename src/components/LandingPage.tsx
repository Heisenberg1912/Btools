import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ToolsGrid } from './ToolsGrid';
import { UserMenu } from '@/components/ui/user-menu';

interface LandingPageProps {
  onImageSelect: (src: string, toolId?: string) => void;
  onNavigateToLogin?: () => void;
  onNavigateToSignup?: () => void;
  user?: any;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export function LandingPage({ onImageSelect, onNavigateToLogin, onNavigateToSignup, user, isAuthenticated, onLogout }: LandingPageProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showCamera) {
      const initCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          setStream(mediaStream);
        } catch (err) {
          console.error("Camera Error:", err);
        }
      };
      initCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [showCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showCamera]);

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string, activeTool || 'general');
        setActiveTool(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onImageSelect(canvas.toDataURL('image/jpeg'), activeTool || 'general');
        setActiveTool(null);
        setShowCamera(false);
      }
    }
  };

  const toolTitles: Record<string, string> = {
    progress: 'Progress Tracking Analysis',
    financial: 'Financial Audit & Costing',
    safety: 'Safety & Hazard Inspection',
    valuation: 'Property Valuation Report',
    manpower: 'Manpower & Trade Counting',
    machinery: 'Equipment Utilization Check',
    geo: 'Geo-Environmental Analysis',
    monitor: 'Live Site Monitor Setup',
    blueprint: 'Blueprint Code Compliance',
    qc: 'Quality Control Defect Detection',
    renovation: 'Renovation ROI Estimator'
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">V</div>
           <span className="text-xl font-bold tracking-tight text-slate-900">VitruviAI</span>
        </div>
        <div className="flex gap-4 items-center">
           {isAuthenticated ? (
             <UserMenu user={user} onLogout={onLogout} />
           ) : (
             <>
               <Button 
                 variant="ghost" 
                 className="hidden md:inline-flex text-slate-600 hover:text-slate-900"
                 onClick={onNavigateToLogin}
               >
                 Log in
               </Button>
               <Button 
                 className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-full px-6"
                 onClick={onNavigateToSignup}
               >
                 Sign up
               </Button>
             </>
           )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section */}
        <div className="w-full bg-white relative pt-20 pb-12 px-4 text-center overflow-hidden border-b border-slate-100">
           {/* Subtle Grid Pattern */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-white/80" />
           
           <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="relative z-10 max-w-4xl mx-auto space-y-6"
           >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                 The Operating System for <br className="hidden md:block"/>
                 <span className="text-blue-600">Modern Construction</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                 Deploy specialized AI agents to audit finances, track progress, and ensure safety.
                 <br className="hidden md:block"/> No setup required. Just upload and analyze.
              </p>
           </motion.div>
        </div>

        {/* Tools Grid Section */}
        <div className="w-full max-w-7xl px-4 z-20">
           <ToolsGrid onToolSelect={handleToolSelect} />
        </div>

        {/* Upload Modal (Controlled by activeTool) */}
        <Dialog open={!!activeTool} onOpenChange={(open) => !open && setActiveTool(null)}>
           <DialogContent className="sm:max-w-md">
              <DialogHeader>
                 <DialogTitle className="flex items-center gap-2 text-xl">
                    <Upload className="h-5 w-5 text-blue-600" />
                    {activeTool ? toolTitles[activeTool] : 'Upload Project Image'}
                 </DialogTitle>
                 <DialogDescription>
                    Upload a site photo, blueprint, or scan to begin analysis.
                 </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                 <Card 
                   className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${isHovering ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}
                   onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                   onDragLeave={() => setIsHovering(false)}
                   onDrop={(e) => {
                     e.preventDefault();
                     setIsHovering(false);
                     const file = e.dataTransfer.files[0];
                     if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                           onImageSelect(reader.result as string, activeTool || 'general');
                           setActiveTool(null);
                        };
                        reader.readAsDataURL(file);
                     }
                   }}
                 >
                    <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                       <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${isHovering ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Upload className="h-8 w-8" />
                       </div>
                       <div className="text-center space-y-1">
                          <h3 className="font-semibold text-lg text-slate-900">Click to upload</h3>
                          <p className="text-sm text-slate-500">or drag and drop file here</p>
                       </div>
                       
                       <input id="tool-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </CardContent>
                 </Card>

                 <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                    <span className="relative bg-white px-2 text-xs text-muted-foreground uppercase font-medium">Or</span>
                 </div>

                 <Button 
                    variant="outline" 
                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                    onClick={() => setShowCamera(true)}
                 >
                    <Camera className="mr-2 h-4 w-4" /> Use Live Camera
                 </Button>
                 
                 <Button 
                    variant="ghost" 
                    className="w-full mt-2 text-slate-400 hover:text-slate-600"
                    onClick={() => document.getElementById('tool-upload')?.click()}
                 >
                    Browse Files
                 </Button>
              </div>
           </DialogContent>
        </Dialog>

        {/* Camera Modal (Nested or separate) */}
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
           <DialogContent>
              <DialogHeader>
                 <DialogTitle>Camera Capture</DialogTitle>
                 <DialogDescription>Take a clear photo of the construction site.</DialogDescription>
              </DialogHeader>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                 </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                 <Button variant="ghost" onClick={() => setShowCamera(false)}>Cancel</Button>
                 <Button onClick={capturePhoto}>Capture Photo</Button>
              </div>
           </DialogContent>
        </Dialog>

      </main>

      <footer className="py-8 bg-white border-t mt-auto">
           <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
              <p className="flex items-center justify-center gap-6">
                 <span>© 2026 VitruviAI Inc.</span>
                 <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
                 <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
                 <a href="#" className="hover:text-slate-900 transition-colors">Enterprise</a>
              </p>
           </div>
      </footer>
    </div>
  );
}
