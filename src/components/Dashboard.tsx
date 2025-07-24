import React, { useState } from 'react';
import { ArrowLeft, Download, FileText, Database, ChevronDown, ChevronRight, Copy, ArrowUpDown, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AnalysisInsights } from './AnalysisInsights';
import type { DumpFile, AnalysisData, ModuleInfo, ThreadInfo } from '@/types/dumpAnalysis';

interface DashboardProps {
  file: DumpFile;
  data: AnalysisData;
  onReset: () => void;
}

type SortField = 'name' | 'baseAddress' | 'size' | 'version';
type SortDirection = 'asc' | 'desc';

export const Dashboard: React.FC<DashboardProps> = ({ file, data, onReset }) => {
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set([0]));
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleSortField, setModuleSortField] = useState<SortField>('name');
  const [moduleSortDirection, setModuleSortDirection] = useState<SortDirection>('asc');
  const [showSystemModules, setShowSystemModules] = useState(true);
  const { toast } = useToast();

  const toggleThread = (threadId: number) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard"
    });
  };

  const exportToHtml = () => {
    // Generate HTML report
    const htmlContent = generateHtmlReport(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace('.dmp', '')}_report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "HTML Report Downloaded",
      description: "Crash analysis report has been saved"
    });
  };

  const exportToJson = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace('.dmp', '')}_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-analyzer-error/10 text-analyzer-error border-analyzer-error/20';
      case 'high': return 'bg-analyzer-warning/10 text-analyzer-warning border-analyzer-warning/20';
      case 'medium': return 'bg-analyzer-accent/10 text-analyzer-accent border-analyzer-accent/20';
      case 'low': return 'bg-analyzer-success/10 text-analyzer-success border-analyzer-success/20';
      default: return 'bg-analyzer-elevated text-analyzer-text-muted border-analyzer-border';
    }
  };

  const getThreadStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'bg-analyzer-success/10 text-analyzer-success border-analyzer-success/20';
      case 'waiting': return 'bg-analyzer-warning/10 text-analyzer-warning border-analyzer-warning/20';
      case 'blocked': return 'bg-analyzer-error/10 text-analyzer-error border-analyzer-error/20';
      case 'suspended': return 'bg-analyzer-accent/10 text-analyzer-accent border-analyzer-accent/20';
      default: return 'bg-analyzer-elevated text-analyzer-text-muted border-analyzer-border';
    }
  };

  // Filter and sort modules
  const filteredModules = data.modules
    .filter(module => {
      const matchesSearch = module.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                           module.path.toLowerCase().includes(moduleSearch.toLowerCase());
      const matchesFilter = showSystemModules || !module.isSystemModule;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue: string | number = a[moduleSortField];
      let bValue: string | number = b[moduleSortField];
      
      if (moduleSortField === 'size') {
        aValue = parseInt(a.size.replace('0x', ''), 16);
        bValue = parseInt(b.size.replace('0x', ''), 16);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return moduleSortDirection === 'asc' ? result : -result;
    });

  const handleSort = (field: SortField) => {
    if (moduleSortField === field) {
      setModuleSortDirection(moduleSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setModuleSortField(field);
      setModuleSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen bg-analyzer-bg">
      {/* Header */}
      <div className="bg-analyzer-surface border-b border-analyzer-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-analyzer-text-secondary hover:text-analyzer-text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <div className="h-6 w-px bg-analyzer-border" />
            <div>
              <h1 className="text-xl font-semibold text-analyzer-text-primary">
                {file.name}
              </h1>
              <p className="text-sm text-analyzer-text-secondary">
                {formatFileSize(file.size)} • {file.type} • {file.architecture} • Analyzed {file.uploadedAt.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToHtml}
              className="border-analyzer-border hover:bg-analyzer-elevated"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJson}
              className="border-analyzer-border hover:bg-analyzer-elevated"
            >
              <Database className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="bg-analyzer-surface border border-analyzer-border">
            <TabsTrigger value="analysis" className="data-[state=active]:bg-analyzer-elevated">
              Analysis & Summary
            </TabsTrigger>
            <TabsTrigger value="exception" className="data-[state=active]:bg-analyzer-elevated">
              Exception Details
            </TabsTrigger>
            <TabsTrigger value="threads" className="data-[state=active]:bg-analyzer-elevated">
              Threads
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-analyzer-elevated">
              Modules
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-analyzer-elevated">
              System Info
            </TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <AnalysisInsights data={data} />
            
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-analyzer-surface border-analyzer-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-analyzer-text-muted">Total Threads</p>
                      <p className="text-2xl font-bold text-analyzer-text-primary">{data.statistics.totalThreads}</p>
                    </div>
                    <Badge className="bg-analyzer-accent/10 text-analyzer-accent border-analyzer-accent/20">
                      {data.statistics.runningThreads} Running
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-analyzer-surface border-analyzer-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-analyzer-text-muted">Total Modules</p>
                      <p className="text-2xl font-bold text-analyzer-text-primary">{data.statistics.totalModules}</p>
                    </div>
                    <Badge className="bg-analyzer-success/10 text-analyzer-success border-analyzer-success/20">
                      {data.statistics.modulesWithSymbols} w/ Symbols
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-analyzer-surface border-analyzer-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-analyzer-text-muted">System Modules</p>
                      <p className="text-2xl font-bold text-analyzer-text-primary">{data.statistics.systemModules}</p>
                    </div>
                    <Badge className="bg-analyzer-elevated text-analyzer-text-muted border-analyzer-border">
                      Microsoft
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-analyzer-surface border-analyzer-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-analyzer-text-muted">3rd Party</p>
                      <p className="text-2xl font-bold text-analyzer-text-primary">{data.statistics.thirdPartyModules}</p>
                    </div>
                    <Badge className="bg-analyzer-warning/10 text-analyzer-warning border-analyzer-warning/20">
                      Custom
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Exception Tab */}
          <TabsContent value="exception" className="space-y-6">
            <Card className="bg-analyzer-surface border-analyzer-border">
              <CardHeader>
                <CardTitle className="text-analyzer-text-primary flex items-center">
                  <div className="w-2 h-2 bg-analyzer-error rounded-full mr-3" />
                  Exception Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-analyzer-text-muted mb-2">Exception Code</p>
                      <div className="flex items-center space-x-2">
                        <code className="bg-analyzer-elevated px-3 py-2 rounded text-analyzer-error font-mono">
                          {data.exception.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(data.exception.code)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-analyzer-text-muted mb-2">Exception Address</p>
                      <code className="bg-analyzer-elevated px-3 py-2 rounded text-analyzer-accent font-mono block">
                        {data.exception.address}
                      </code>
                    </div>
                    
                    <div>
                      <p className="text-sm text-analyzer-text-muted mb-2">Severity</p>
                      <Badge className={getSeverityColor(data.exception.severity)}>
                        {data.exception.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-analyzer-text-muted mb-2">Failing Module</p>
                      <code className="bg-analyzer-elevated px-3 py-2 rounded text-analyzer-accent font-mono block">
                        {data.exception.module}
                      </code>
                    </div>
                    
                    {data.exception.function && (
                      <div>
                        <p className="text-sm text-analyzer-text-muted mb-2">Function</p>
                        <code className="bg-analyzer-elevated px-3 py-2 rounded text-analyzer-text-primary font-mono block">
                          {data.exception.function}
                        </code>
                      </div>
                    )}
                    
                    {data.exception.offset && (
                      <div>
                        <p className="text-sm text-analyzer-text-muted mb-2">Offset</p>
                        <code className="bg-analyzer-elevated px-3 py-2 rounded text-analyzer-text-secondary font-mono block">
                          {data.exception.offset}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-analyzer-elevated border border-analyzer-border rounded-lg p-4">
                  <h4 className="font-medium text-analyzer-text-primary mb-2">Description</h4>
                  <p className="text-analyzer-text-secondary leading-relaxed">{data.exception.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threads Tab */}
          <TabsContent value="threads" className="space-y-6">
            <Card className="bg-analyzer-surface border-analyzer-border">
              <CardHeader>
                <CardTitle className="text-analyzer-text-primary">
                  Thread Information ({data.threads.length} threads)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.threads.map(thread => (
                  <Collapsible
                    key={thread.id}
                    open={expandedThreads.has(thread.id)}
                    onOpenChange={() => toggleThread(thread.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto bg-analyzer-elevated hover:bg-analyzer-border border border-analyzer-border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            {expandedThreads.has(thread.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-analyzer-text-primary">
                                Thread {thread.id}
                              </span>
                              {thread.isMainThread && (
                                <Badge className="bg-analyzer-accent/10 text-analyzer-accent border-analyzer-accent/20 text-xs">
                                  Main
                                </Badge>
                              )}
                              {thread.name && (
                                <span className="text-analyzer-text-secondary text-sm">
                                  ({thread.name})
                                </span>
                              )}
                              <Badge className={getThreadStateColor(thread.state)}>
                                {thread.state}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-analyzer-text-muted">
                              <span>{thread.stackTrace.length} frames</span>
                              <span>Priority: {thread.priority}</span>
                              <span>CPU: {thread.cpu}</span>
                              {thread.waitReason && <span>Wait: {thread.waitReason}</span>}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-analyzer-elevated border border-analyzer-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-analyzer-border hover:bg-analyzer-border/50">
                              <TableHead className="text-analyzer-text-muted">Address</TableHead>
                              <TableHead className="text-analyzer-text-muted">Module</TableHead>
                              <TableHead className="text-analyzer-text-muted">Function</TableHead>
                              <TableHead className="text-analyzer-text-muted">Offset</TableHead>
                              <TableHead className="text-analyzer-text-muted">Symbols</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {thread.stackTrace.map((frame, index) => (
                              <TableRow key={index} className="border-analyzer-border hover:bg-analyzer-border/30">
                                <TableCell className="font-mono text-analyzer-accent text-sm">
                                  {frame.address}
                                </TableCell>
                                <TableCell className="text-analyzer-text-primary text-sm">
                                  {frame.module}
                                </TableCell>
                                <TableCell className="font-mono text-analyzer-text-primary text-sm">
                                  {frame.function}
                                  {frame.sourceFile && (
                                    <div className="text-xs text-analyzer-text-muted">
                                      {frame.sourceFile}:{frame.lineNumber}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-analyzer-text-secondary text-sm">
                                  {frame.offset}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={frame.hasSymbols ? "default" : "secondary"}
                                    className={
                                      frame.hasSymbols 
                                        ? "bg-analyzer-success/10 text-analyzer-success border-analyzer-success/20" 
                                        : "bg-analyzer-warning/10 text-analyzer-warning border-analyzer-warning/20"
                                    }
                                  >
                                    {frame.hasSymbols ? "Yes" : "No"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <Card className="bg-analyzer-surface border-analyzer-border">
              <CardHeader>
                <CardTitle className="text-analyzer-text-primary flex items-center justify-between">
                  <span>Loaded Modules ({filteredModules.length} of {data.modules.length})</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSystemModules(!showSystemModules)}
                      className={`border-analyzer-border ${!showSystemModules ? 'bg-analyzer-accent/10 text-analyzer-accent' : ''}`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      {showSystemModules ? 'Hide System' : 'Show System'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-analyzer-text-muted w-4 h-4" />
                  <Input
                    placeholder="Search modules..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="pl-10 bg-analyzer-elevated border-analyzer-border"
                  />
                </div>
                
                <div className="bg-analyzer-elevated border border-analyzer-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-analyzer-border hover:bg-analyzer-border/50">
                        <TableHead 
                          className="text-analyzer-text-muted cursor-pointer hover:text-analyzer-text-primary"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Module</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-analyzer-text-muted cursor-pointer hover:text-analyzer-text-primary"
                          onClick={() => handleSort('baseAddress')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Base Address</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-analyzer-text-muted cursor-pointer hover:text-analyzer-text-primary"
                          onClick={() => handleSort('size')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Size</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-analyzer-text-muted cursor-pointer hover:text-analyzer-text-primary"
                          onClick={() => handleSort('version')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Version</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-analyzer-text-muted">Company</TableHead>
                        <TableHead className="text-analyzer-text-muted">Symbols</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModules.map((module, index) => (
                        <TableRow key={index} className="border-analyzer-border hover:bg-analyzer-border/30">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium ${module.isSystemModule ? 'text-analyzer-text-secondary' : 'text-analyzer-text-primary'}`}>
                                {module.name}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${module.isSystemModule ? 'border-analyzer-border text-analyzer-text-muted' : 'border-analyzer-accent text-analyzer-accent'}`}
                              >
                                {module.imageType.toUpperCase()}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-analyzer-accent text-sm">
                            {module.baseAddress}
                          </TableCell>
                          <TableCell className="font-mono text-analyzer-text-secondary text-sm">
                            {module.size}
                          </TableCell>
                          <TableCell className="text-analyzer-text-secondary text-sm">
                            {module.version}
                          </TableCell>
                          <TableCell className="text-analyzer-text-muted text-sm">
                            {module.company}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={module.hasSymbols ? "default" : "secondary"}
                              className={
                                module.hasSymbols 
                                  ? "bg-analyzer-success/10 text-analyzer-success border-analyzer-success/20" 
                                  : "bg-analyzer-warning/10 text-analyzer-warning border-analyzer-warning/20"
                              }
                            >
                              {module.hasSymbols ? "Available" : "Missing"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Info Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-analyzer-surface border-analyzer-border">
                <CardHeader>
                  <CardTitle className="text-analyzer-text-primary">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">OS Version</span>
                      <span className="text-analyzer-text-primary">{data.systemInfo.osVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Architecture</span>
                      <span className="text-analyzer-text-primary">{data.systemInfo.processorArchitecture}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Processors</span>
                      <span className="text-analyzer-text-primary">{data.systemInfo.processorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Total Memory</span>
                      <span className="text-analyzer-text-primary">{data.systemInfo.totalMemory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Available Memory</span>
                      <span className="text-analyzer-text-primary">{data.systemInfo.availableMemory}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-analyzer-surface border-analyzer-border">
                <CardHeader>
                  <CardTitle className="text-analyzer-text-primary">Process Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Process Name</span>
                      <span className="text-analyzer-text-primary font-mono">{data.processInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Process ID</span>
                      <span className="text-analyzer-text-primary">{data.processInfo.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Session ID</span>
                      <span className="text-analyzer-text-primary">{data.processInfo.sessionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Working Set</span>
                      <span className="text-analyzer-text-primary">{data.processInfo.workingSetSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-analyzer-text-muted">Virtual Size</span>
                      <span className="text-analyzer-text-primary">{data.processInfo.virtualSize}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper function to generate HTML report
function generateHtmlReport(data: AnalysisData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memory Dump Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #2c3e50; }
        .header { border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .highlight { background: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .code { font-family: 'Courier New', monospace; background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Memory Dump Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p><strong>File:</strong> ${data.fileInfo.name} (${(data.fileInfo.size / 1024 / 1024).toFixed(2)} MB)</p>
        </div>

        <div class="section">
            <h2>🔥 Crash Analysis</h2>
            <div class="info-grid">
                <div class="info-item">
                    <h4>Crash Type</h4>
                    <span class="highlight">${data.analysis.crashType}</span>
                </div>
                <div class="info-item">
                    <h4>Severity</h4>
                    <span class="highlight">${data.analysis.severity.toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <h4>Confidence</h4>
                    <span>${data.analysis.confidence}%</span>
                </div>
            </div>
            <p><strong>Root Cause:</strong> ${data.analysis.likelyRootCause}</p>
        </div>

        <div class="section">
            <h2>⚠️ Exception Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <h4>Exception Code</h4>
                    <span class="code">${data.exception.code}</span>
                </div>
                <div class="info-item">
                    <h4>Address</h4>
                    <span class="code">${data.exception.address}</span>
                </div>
                <div class="info-item">
                    <h4>Module</h4>
                    <span class="code">${data.exception.module}</span>
                </div>
            </div>
            <p><strong>Description:</strong> ${data.exception.description}</p>
        </div>

        <div class="section">
            <h2>💡 Recommendations</h2>
            <ul>
                ${data.analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>🧵 Thread Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>State</th>
                        <th>Stack Frames</th>
                        <th>Main Thread</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.threads.map(thread => `
                        <tr>
                            <td>${thread.id}</td>
                            <td>${thread.name || 'N/A'}</td>
                            <td>${thread.state}</td>
                            <td>${thread.stackTrace.length}</td>
                            <td>${thread.isMainThread ? 'Yes' : 'No'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📦 Key Modules</h2>
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>Version</th>
                        <th>Base Address</th>
                        <th>Has Symbols</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.modules.slice(0, 10).map(module => `
                        <tr>
                            <td>${module.name}</td>
                            <td>${module.version}</td>
                            <td class="code">${module.baseAddress}</td>
                            <td>${module.hasSymbols ? 'Yes' : 'No'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>💻 System Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <h4>OS Version</h4>
                    <span>${data.systemInfo.osVersion}</span>
                </div>
                <div class="info-item">
                    <h4>Architecture</h4>
                    <span>${data.systemInfo.processorArchitecture}</span>
                </div>
                <div class="info-item">
                    <h4>Total Memory</h4>
                    <span>${data.systemInfo.totalMemory}</span>
                </div>
                <div class="info-item">
                    <h4>Process</h4>
                    <span>${data.processInfo.name} (PID: ${data.processInfo.id})</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}