import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { Dashboard } from './Dashboard';
import { DumpParser } from '@/utils/dumpParser';
import { AnalysisEngine } from '@/utils/analysisEngine';
import type { DumpFile, AnalysisData } from '@/types/dumpAnalysis';
import { useToast } from '@/hooks/use-toast';

const MemoryDumpAnalyzer: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<DumpFile | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      // Parse the dump file
      const parsedData = await DumpParser.parseFile(file);
      
      // Run analysis engine
      const analyzedData = AnalysisEngine.analyzeData(parsedData);
      
      setCurrentFile(analyzedData.fileInfo);
      setAnalysisData(analyzedData);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${file.name}`,
      });
    } catch (error) {
      console.error('Error analyzing dump file:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze dump file",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setAnalysisData(null);
    setIsAnalyzing(false);
  };

  if (currentFile && analysisData) {
    return (
      <Dashboard 
        file={currentFile} 
        data={analysisData} 
        onReset={handleReset}
      />
    );
  }

  return (
    <FileUpload 
      onFileUpload={handleFileUpload}
      isAnalyzing={isAnalyzing}
    />
  );
};

export default MemoryDumpAnalyzer;