import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Target, Lightbulb, Bug, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { AnalysisData } from '@/types/dumpAnalysis';
import { AnalysisEngine } from '@/utils/analysisEngine';

interface AnalysisInsightsProps {
  data: AnalysisData;
}

export const AnalysisInsights: React.FC<AnalysisInsightsProps> = ({ data }) => {
  const patterns = AnalysisEngine.detectCommonPatterns(data);
  const foundPatterns = patterns.filter(p => p.found);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-analyzer-error" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-analyzer-warning" />;
      case 'medium': return <Info className="w-4 h-4 text-analyzer-accent" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-analyzer-success" />;
      default: return <Info className="w-4 h-4 text-analyzer-text-muted" />;
    }
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

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <Card className="bg-analyzer-surface border-analyzer-border">
        <CardHeader>
          <CardTitle className="text-analyzer-text-primary flex items-center">
            <Target className="w-5 h-5 mr-2 text-analyzer-accent" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-analyzer-text-secondary">Crash Type</span>
                <Badge className={getSeverityColor(data.analysis.severity)}>
                  {data.analysis.crashType}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-analyzer-text-secondary">Confidence</span>
                <div className="flex items-center space-x-2">
                  <Progress value={data.analysis.confidence} className="w-20 h-2" />
                  <span className="text-analyzer-text-primary font-medium">{data.analysis.confidence}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-analyzer-text-secondary">Problem Modules</span>
                <span className="text-analyzer-text-primary">
                  {data.analysis.problemModules.length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-analyzer-text-secondary">Memory Corruption</span>
                <div className="flex items-center space-x-1">
                  {data.analysis.memoryCorruption ? (
                    <XCircle className="w-4 h-4 text-analyzer-error" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-analyzer-success" />
                  )}
                  <span className={data.analysis.memoryCorruption ? 'text-analyzer-error' : 'text-analyzer-success'}>
                    {data.analysis.memoryCorruption ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-analyzer-text-secondary">Deadlock</span>
                <div className="flex items-center space-x-1">
                  {data.analysis.deadlockDetected ? (
                    <XCircle className="w-4 h-4 text-analyzer-error" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-analyzer-success" />
                  )}
                  <span className={data.analysis.deadlockDetected ? 'text-analyzer-error' : 'text-analyzer-success'}>
                    {data.analysis.deadlockDetected ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-analyzer-text-secondary">Stack Overflow</span>
                <div className="flex items-center space-x-1">
                  {data.analysis.stackOverflow ? (
                    <XCircle className="w-4 h-4 text-analyzer-error" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-analyzer-success" />
                  )}
                  <span className={data.analysis.stackOverflow ? 'text-analyzer-error' : 'text-analyzer-success'}>
                    {data.analysis.stackOverflow ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="bg-analyzer-elevated border-analyzer-border">
            <Bug className="h-4 w-4 text-analyzer-accent" />
            <AlertDescription className="text-analyzer-text-secondary">
              <strong className="text-analyzer-text-primary">Root Cause:</strong> {data.analysis.likelyRootCause}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Detected Patterns */}
      {foundPatterns.length > 0 && (
        <Card className="bg-analyzer-surface border-analyzer-border">
          <CardHeader>
            <CardTitle className="text-analyzer-text-primary flex items-center">
              <Shield className="w-5 h-5 mr-2 text-analyzer-warning" />
              Detected Issues ({foundPatterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {foundPatterns.map((pattern, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-analyzer-elevated border border-analyzer-border rounded-lg">
                {getSeverityIcon(pattern.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-analyzer-text-primary">{pattern.pattern}</h4>
                    <Badge className={getSeverityColor(pattern.severity)}>
                      {pattern.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-analyzer-text-secondary">{pattern.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="bg-analyzer-surface border-analyzer-border">
        <CardHeader>
          <CardTitle className="text-analyzer-text-primary flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-analyzer-success" />
            Recommendations ({data.analysis.recommendations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-analyzer-elevated border border-analyzer-border rounded-lg">
              <Zap className="w-4 h-4 text-analyzer-success mt-0.5 flex-shrink-0" />
              <p className="text-analyzer-text-secondary">{recommendation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Problem Modules */}
      {data.analysis.problemModules.length > 0 && (
        <Card className="bg-analyzer-surface border-analyzer-border">
          <CardHeader>
            <CardTitle className="text-analyzer-text-primary flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-analyzer-warning" />
              Problematic Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.analysis.problemModules.map((module, index) => (
                <Badge key={index} variant="outline" className="border-analyzer-warning text-analyzer-warning">
                  {module}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};