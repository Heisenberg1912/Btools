import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { LandingPage } from '@/components/LandingPage'
import { DashboardOverview } from '@/components/dashboard/Overview'
import { FinancialsView } from '@/components/dashboard/Financials'
import { AnalyticsView } from '@/components/dashboard/Analytics'
import { ComplianceView } from '@/components/dashboard/Compliance'
import { ReportsView } from '@/components/dashboard/Reports'
import { SettingsView } from '@/components/dashboard/Settings'
import { SiteMonitorView } from '@/components/dashboard/SiteMonitor'
import { ProjectData, ProjectMode } from '@/types/project'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard, PieChart, FileText, Settings, LogOut, ChevronRight,
  HardHat, ShieldCheck, MessageSquare, Loader2, Send, Check, Zap, Crown, Star,
  Menu, X, Search, Bell, Camera, ArrowLeft, Upload
} from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

import { analyzeProjectImage } from '@/lib/aiService'
import { projectsApi, chatbotApi, subscriptionsApi } from '@/lib/api'

function AppContent() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

  const [authView, setAuthView] = useState<'login' | 'register' | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [projectMode] = useState<ProjectMode>('under-construction')
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null)
  
  // New Single-Page State
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // Usage tracking from backend when authenticated
  const [usageCount, setUsageCount] = useState(() => {
    const saved = localStorage.getItem('vitruvi_usage')
    return saved ? parseInt(saved, 10) : 0
  })
  const [scanLimit, setScanLimit] = useState(3) // Default free tier limit
  const [currentPlan, setCurrentPlan] = useState('free')

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false)
  const [plansModalOpen, setPlansModalOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([
    { role: 'ai', content: "Hello! I've analyzed your project. How can I help you today?" }
  ])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Fetch subscription and usage from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch usage data
      subscriptionsApi.getUsage().then(({ data }) => {
        if (data) {
          setUsageCount(data.scans_used || 0)
          setScanLimit(data.scans_limit || 3)
        }
      })

      // Fetch current subscription details
      subscriptionsApi.getCurrent().then(({ data }) => {
        if (data) {
          setCurrentPlan(data.plan || 'free')
          if (data.max_scans) setScanLimit(data.max_scans)
        }
      })
    }
  }, [isAuthenticated])

  const handleImageSelect = async (src: string, toolId?: string) => {
    setIsAnalyzing(true)
    if (toolId) setSelectedTool(toolId)
    setUploadModalOpen(false)

    try {
      // If authenticated and have a project, use backend
      if (isAuthenticated && currentProjectId) {
        const { data, error } = await projectsApi.analyze(currentProjectId, src, projectMode)
        if (data && data.project_data) {
          setProjectData(data.project_data)
          // Update usage from response
          subscriptionsApi.getUsage().then(({ data: usageData }) => {
            if (usageData) setUsageCount(usageData.scans_used || 0)
          })
        } else if (error) {
          console.error("Backend analysis error:", error)
          alert(`Analysis failed: ${error}`)
        }
      } else {
        // Use local Gemini analysis for unauthenticated users
        const data = await analyzeProjectImage(src, projectMode, toolId)
        setProjectData(data)

        // Increment local usage
        const newCount = usageCount + 1
        setUsageCount(newCount)
        localStorage.setItem('vitruvi_usage', newCount.toString())
      }
    } catch (err) {
      console.error("Analysis error:", err)
      alert(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageSelect(reader.result as string, selectedTool || 'general');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || isChatLoading) return

    const userMessage = chatMessage.trim()
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setIsChatLoading(true)

    try {
      const { data, error } = await chatbotApi.chat(userMessage, currentProjectId || undefined)
      if (data && data.response) {
        setChatHistory(prev => [...prev, { role: 'ai', content: data.response }])
      } else if (error) {
        setChatHistory(prev => [...prev, {
          role: 'ai',
          content: `Error: ${error}`
        }])
      }
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setSelectedTool(null)
    setProjectData(null)
    setCurrentProjectId(null)
  }

  // Check if plan has unlimited scans (scans_limit = -1 means unlimited)
  const hasUnlimitedScans = scanLimit === -1 || currentPlan === 'pro' || currentPlan === 'enterprise'
  const isPaywalled = !hasUnlimitedScans && usageCount >= scanLimit
  const scansRemaining = hasUnlimitedScans ? Infinity : Math.max(0, scanLimit - usageCount)

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Show Login/Register if user clicked auth buttons
  console.log('Auth check:', { isAuthenticated, authView });
  if (!isAuthenticated && authView) {
    console.log('Showing auth view:', authView);
    const handleAuthSuccess = () => {
      console.log('Auth success - clearing authView');
      // Clear authView - user will be redirected back to landing page
      // because isAuthenticated will become true and !isAuthenticated && authView will be false
      // The component will re-render and show the landing page
    }

    if (authView === 'login') {
      console.log('Rendering Login component');
      return (
        <Login
          onSwitchToRegister={() => setAuthView('register')}
          onSuccess={handleAuthSuccess}
        />
      )
    }
    console.log('Rendering Register component');
    return (
      <Register
        onSwitchToLogin={() => setAuthView('login')}
        onSuccess={handleAuthSuccess}
      />
    )
  }

  // Render Tool View
  const renderToolView = () => {
    if (isAnalyzing) {
      return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
           <div className="relative">
              <div className="h-24 w-24 border-4 border-blue-100 rounded-full animate-ping absolute inset-0" />
              <div className="h-24 w-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative z-10" />
           </div>
           <div className="text-center space-y-2">
             <h2 className="text-2xl font-bold text-slate-900">Analyzing Project Data...</h2>
             <p className="text-slate-500 max-w-md mx-auto">
                Running computer vision models for {selectedTool} analysis.
             </p>
           </div>
        </div>
      )
    }

    if (!projectData) return null;

    switch (selectedTool) {
      case 'progress': return <DashboardOverview data={projectData} isPaywalled={isPaywalled} />;
      case 'financial': return <FinancialsView data={projectData} isPaywalled={isPaywalled} />;
      case 'safety': return <AnalyticsView data={projectData} isPaywalled={isPaywalled} defaultTab="safety" />;
      case 'valuation': return <FinancialsView data={projectData} isPaywalled={isPaywalled} />; 
      case 'manpower': return <AnalyticsView data={projectData} isPaywalled={isPaywalled} defaultTab="manpower" />;
      case 'machinery': return <AnalyticsView data={projectData} isPaywalled={isPaywalled} defaultTab="machinery" />;
      case 'geo': return <ComplianceView data={projectData} isPaywalled={isPaywalled} />;
      case 'blueprint': return <ComplianceView data={projectData} isPaywalled={isPaywalled} />;
      case 'qc': return <AnalyticsView data={projectData} isPaywalled={isPaywalled} defaultTab="safety" />; // Defect/Safety overlap
      case 'renovation': return <FinancialsView data={projectData} isPaywalled={isPaywalled} />;
      case 'monitor': return <SiteMonitorView />;
      case 'reports': return <ReportsView isPaywalled={isPaywalled} />;
      default: return <DashboardOverview data={projectData} isPaywalled={isPaywalled} />;
    }
  }

  // Landing Page Mode
  if (!selectedTool) {
    return (
      <LandingPage
        onImageSelect={handleImageSelect}
        onNavigateToLogin={() => {
          console.log('onNavigateToLogin called, setting authView to login');
          setAuthView('login');
        }}
        onNavigateToSignup={() => {
          console.log('onNavigateToSignup called, setting authView to register');
          setAuthView('register');
        }}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
    )
  }

  // Tool Result Mode
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Tool Header */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTool(null)} className="text-slate-500 hover:text-slate-900">
               <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tools
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4" />
               </div>
               <span className="font-bold text-lg capitalize">{selectedTool} Analysis</span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:inline">
               {hasUnlimitedScans
                 ? 'Unlimited scans'
                 : isPaywalled
                   ? 'Plan Limit Reached'
                   : `${scansRemaining} scans remaining`}
            </span>
            <Button onClick={() => setUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
               <Upload className="h-4 w-4 mr-2" /> New Scan
            </Button>
            <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">
               {user?.name?.charAt(0) || 'U'}
            </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
         <AnimatePresence mode="wait">
            <motion.div
               key={selectedTool}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
            >
               {renderToolView()}
            </motion.div>
         </AnimatePresence>
      </main>

      {/* Chatbot Bubble (Always available in Result Mode) */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
           <DialogTrigger asChild>
              <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 z-50">
                 <MessageSquare className="h-6 w-6" />
              </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 gap-0">
              <DialogHeader className="p-4 border-b bg-slate-50">
                 <DialogTitle>AI Assistant</DialogTitle>
                 <DialogDescription>Ask about the {selectedTool} data.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                 {chatHistory.map((msg, index) => (
                   <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        msg.role === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {msg.role === 'ai' ? 'AI' : 'U'}
                      </div>
                      <div className={`p-3 rounded-lg text-sm max-w-[80%] ${
                        msg.role === 'ai' ? 'bg-slate-100' : 'bg-blue-600 text-white'
                      }`}>
                         {msg.content}
                      </div>
                   </div>
                 ))}
                 {isChatLoading && (
                   <div className="flex gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">AI</div>
                      <div className="bg-slate-100 p-3 rounded-lg">
                         <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                   </div>
                 )}
              </div>
              <div className="p-4 border-t">
                 <form className="flex gap-2" onSubmit={handleChatSubmit}>
                    <Input
                      placeholder="Type a message..."
                      className="flex-1"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={isChatLoading}
                    />
                    <Button type="submit" size="sm" disabled={isChatLoading || !chatMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                 </form>
              </div>
           </DialogContent>
      </Dialog>

      {/* Reused Upload Modal for "New Scan" */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  New {selectedTool} Scan
               </DialogTitle>
               <DialogDescription>
                  Upload a new image to re-run the analysis.
               </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
               <Card className="border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <CardContent className="flex flex-col items-center justify-center py-10" onClick={() => document.getElementById('new-scan-upload')?.click()}>
                     <Upload className="h-10 w-10 text-slate-400 mb-2" />
                     <p className="text-sm font-medium text-slate-700">Click to upload or drag file</p>
                     <input id="new-scan-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </CardContent>
               </Card>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App