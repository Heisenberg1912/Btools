import { useState } from 'react';
import { FileText, Download, Lock, Search, Filter, Plus, Eye, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  isPaywalled: boolean;
}

export function ReportsView({ isPaywalled }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState('All');

  const reports = [
    { id: 'R-2024-001', name: 'Detailed Valuation Certificate', category: 'Financial', type: 'PDF', size: '2.4 MB', status: 'Ready', date: 'Feb 02, 2026', premium: true },
    { id: 'R-2024-002', name: 'Bank-Grade Appraisal Report', category: 'Financial', type: 'PDF', size: '5.1 MB', status: 'Ready', date: 'Feb 01, 2026', premium: true },
    { id: 'R-2024-003', name: 'Investor Presentation Deck', category: 'Financial', type: 'PPTX', size: '12 MB', status: 'Ready', date: 'Jan 28, 2026', premium: true },
    { id: 'R-2024-004', name: 'Site Safety Audit Log', category: 'Compliance', type: 'PDF', size: '3.5 MB', status: 'Ready', date: 'Feb 04, 2026', premium: false },
    { id: 'R-2024-005', name: 'Sustainability & Carbon Impact', category: 'Compliance', type: 'PDF', size: '4.0 MB', status: 'Processing', date: 'Feb 04, 2026', premium: false },
    { id: 'R-2024-006', name: 'Contractor Performance Review', category: 'Technical', type: 'XLSX', size: '1.2 MB', status: 'Ready', date: 'Jan 15, 2026', premium: true },
    { id: 'R-2024-007', name: 'Cash Flow Projection Sheet', category: 'Financial', type: 'XLSX', size: '850 KB', status: 'Ready', date: 'Feb 03, 2026', premium: true },
  ];

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.category === filter);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-3xl font-bold tracking-tight">Reports Center</h2>
             <p className="text-muted-foreground">Generate, manage, and audit project documentation.</p>
          </div>
          <Dialog>
             <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                   <Plus className="mr-2 h-4 w-4" /> Generate Report
                </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                   <DialogTitle>Generate New Report</DialogTitle>
                   <DialogDescription>
                      Select the report type and parameters below.
                   </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <div className="grid gap-2">
                      <label htmlFor="type" className="text-sm font-medium">Report Type</label>
                      <Select>
                         <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="valuation">Full Valuation Report</SelectItem>
                            <SelectItem value="audit">Safety Audit Log</SelectItem>
                            <SelectItem value="progress">Weekly Progress Update</SelectItem>
                            <SelectItem value="financial">Financial & Budget Analysis</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="grid gap-2">
                      <label htmlFor="format" className="text-sm font-medium">Format</label>
                      <Select defaultValue="pdf">
                         <SelectTrigger>
                            <SelectValue placeholder="Select format..." />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                            <SelectItem value="pptx">PowerPoint Presentation</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="grid gap-2">
                      <label className="text-sm font-medium">Date Range</label>
                      <Button variant="outline" className="justify-start text-left font-normal text-muted-foreground">
                         <Calendar className="mr-2 h-4 w-4" /> Last 30 Days
                      </Button>
                   </div>
                </div>
                <DialogFooter>
                   <Button onClick={handleGenerate} disabled={isGenerating}>
                      {isGenerating ? (
                         <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                         </>
                      ) : (
                         "Generate Document"
                      )}
                   </Button>
                </DialogFooter>
             </DialogContent>
          </Dialog>
       </div>

       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-1 rounded-xl border">
          <Tabs defaultValue="All" className="w-full md:w-auto" onValueChange={setFilter}>
             <TabsList className="bg-transparent p-0 h-9">
                <TabsTrigger value="All" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4">All Reports</TabsTrigger>
                <TabsTrigger value="Financial" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4">Financial</TabsTrigger>
                <TabsTrigger value="Compliance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4">Compliance</TabsTrigger>
                <TabsTrigger value="Technical" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4">Technical</TabsTrigger>
             </TabsList>
          </Tabs>
          <div className="relative w-full md:w-64 mr-2">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search documents..." className="pl-9 h-9 border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-slate-100 transition-colors" />
          </div>
       </div>

       <Card>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                   <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                         <TableCell className="font-mono text-xs text-muted-foreground">{report.id}</TableCell>
                         <TableCell>
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold text-[10px] border border-blue-100">
                                  {report.type}
                               </div>
                               <div>
                                  <div className="font-medium text-sm">{report.name}</div>
                                  <div className="text-xs text-muted-foreground">{report.size}</div>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell>
                            <Badge variant="outline" className="font-normal text-slate-500">
                               {report.category}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">{report.date}</TableCell>
                         <TableCell>
                            {report.status === 'Processing' ? (
                               <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Processing
                               </Badge>
                            ) : (
                               <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 gap-1">
                                  Ready
                               </Badge>
                            )}
                         </TableCell>
                         <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                                  <Eye className="h-4 w-4" />
                               </Button>
                               {report.premium && isPaywalled ? (
                                  <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-slate-400">
                                     <Lock className="h-4 w-4" />
                                  </Button>
                               ) : (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                     <Download className="h-4 w-4" />
                                  </Button>
                               )}
                            </div>
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          </CardContent>
       </Card>
    </div>
  );
}
