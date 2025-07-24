import React, { useState } from 'react';
import { ArrowLeft, Download, FileText, Database, ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { DumpFile, AnalysisData } from './MemoryDumpAnalyzer';

interface DashboardProps {
  file: DumpFile;
  data: AnalysisData;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ file, data, onReset }) => {
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set([0]));
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
    toast({
      title: "Export initiated",
      description: "HTML report will be downloaded shortly"
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
                {formatFileSize(file.size)} • Analyzed {file.uploadedAt.toLocaleString()}
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

      <div className="p-6 space-y-6">
        {/* Crash Summary */}
        <Card className="bg-analyzer-surface border-analyzer-border">
          <CardHeader>
            <CardTitle className="text-analyzer-text-primary flex items-center">
              <div className="w-2 h-2 bg-analyzer-error rounded-full mr-3" />
              Crash Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-analyzer-text-muted">Exception Code</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-analyzer-elevated px-2 py-1 rounded text-analyzer-error font-mono text-sm">
                    {data.crashSummary.exceptionCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.crashSummary.exceptionCode)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-analyzer-text-muted">Process</p>
                <p className="text-analyzer-text-primary font-medium">
                  {data.crashSummary.processName} (PID: {data.crashSummary.processId})
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-analyzer-text-muted">Crash Type</p>
                <Badge variant="destructive" className="bg-analyzer-error/10 text-analyzer-error border-analyzer-error/20">
                  {data.crashSummary.crashType}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-analyzer-text-muted">Exception Address</p>
                <code className="bg-analyzer-elevated px-2 py-1 rounded text-analyzer-accent font-mono text-sm">
                  {data.crashSummary.exceptionAddress}
                </code>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-analyzer-text-muted">Timestamp</p>
                <p className="text-analyzer-text-secondary text-sm">
                  {new Date(data.crashSummary.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exception Details */}
        <Card className="bg-analyzer-surface border-analyzer-border">
          <CardHeader>
            <CardTitle className="text-analyzer-text-primary">Exception Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-analyzer-elevated border border-analyzer-border rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-analyzer-text-muted mb-1">Exception Type</p>
                  <code className="text-analyzer-error font-mono">{data.exception.type}</code>
                </div>
                <div>
                  <p className="text-sm text-analyzer-text-muted mb-1">Description</p>
                  <p className="text-analyzer-text-secondary">{data.exception.message}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-analyzer-text-muted mb-1">Module</p>
                    <code className="text-analyzer-accent font-mono text-sm">{data.exception.module}</code>
                  </div>
                  <div>
                    <p className="text-sm text-analyzer-text-muted mb-1">Function</p>
                    <code className="text-analyzer-text-primary font-mono text-sm">{data.exception.function}</code>
                  </div>
                  <div>
                    <p className="text-sm text-analyzer-text-muted mb-1">Address</p>
                    <code className="text-analyzer-accent font-mono text-sm">{data.exception.address}</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Threads */}
        <Card className="bg-analyzer-surface border-analyzer-border">
          <CardHeader>
            <CardTitle className="text-analyzer-text-primary">
              Threads ({data.threads.length})
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
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-analyzer-text-primary">
                            Thread {thread.id}
                          </span>
                          {thread.name && (
                            <span className="text-analyzer-text-secondary">
                              ({thread.name})
                            </span>
                          )}
                          <Badge 
                            variant={thread.state === 'Running' ? 'default' : 'secondary'}
                            className={
                              thread.state === 'Running' 
                                ? 'bg-analyzer-success/10 text-analyzer-success border-analyzer-success/20'
                                : 'bg-analyzer-elevated text-analyzer-text-muted border-analyzer-border'
                            }
                          >
                            {thread.state}
                          </Badge>
                        </div>
                        <p className="text-sm text-analyzer-text-muted">
                          {thread.stackTrace.length} stack frames
                        </p>
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
                            </TableCell>
                            <TableCell className="font-mono text-analyzer-text-secondary text-sm">
                              {frame.offset}
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

        {/* Modules */}
        <Card className="bg-analyzer-surface border-analyzer-border">
          <CardHeader>
            <CardTitle className="text-analyzer-text-primary">
              Loaded Modules ({data.modules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-analyzer-elevated border border-analyzer-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-analyzer-border hover:bg-analyzer-border/50">
                    <TableHead className="text-analyzer-text-muted">Module</TableHead>
                    <TableHead className="text-analyzer-text-muted">Base Address</TableHead>
                    <TableHead className="text-analyzer-text-muted">Size</TableHead>
                    <TableHead className="text-analyzer-text-muted">Version</TableHead>
                    <TableHead className="text-analyzer-text-muted">Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.modules.map((module, index) => (
                    <TableRow key={index} className="border-analyzer-border hover:bg-analyzer-border/30">
                      <TableCell className="font-medium text-analyzer-text-primary">
                        {module.name}
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
                      <TableCell className="text-analyzer-text-muted text-sm max-w-xs truncate">
                        {module.path}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};