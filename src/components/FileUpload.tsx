import React, { useCallback, useState } from 'react';
import { Upload, FileType, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isAnalyzing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedExtensions = ['.dmp', '.mdmp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid memory dump file (.dmp or .mdmp)",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 500MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    onFileUpload(file);
  }, [onFileUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-analyzer-bg flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow">
              <FileType className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-analyzer-text-primary mb-4">
            Memory Dump Analyzer
          </h1>
          <p className="text-xl text-analyzer-text-secondary max-w-2xl mx-auto">
            Upload and analyze Windows memory dump files (.dmp) to investigate crashes, 
            exceptions, and system failures with detailed stack traces and module information.
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="bg-analyzer-surface border-analyzer-border shadow-elevated">
          <div
            className={`p-12 text-center border-2 border-dashed rounded-xl transition-all duration-300 ${
              isDragOver 
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-analyzer-border hover:border-analyzer-accent/50'
            } ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isAnalyzing ? (
              <div className="space-y-6">
                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-analyzer-text-primary">
                    Analyzing Memory Dump...
                  </h3>
                  <p className="text-analyzer-text-secondary">
                    Processing your dump file and extracting crash information
                  </p>
                  <div className="max-w-md mx-auto">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-analyzer-text-muted mt-2">
                      {uploadProgress}% complete
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Upload className="w-16 h-16 text-analyzer-accent mx-auto" />
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-analyzer-text-primary">
                    Drop your memory dump file here
                  </h3>
                  <p className="text-analyzer-text-secondary">
                    Supports .dmp and .mdmp files up to 500MB
                  </p>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".dmp,.mdmp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-3 text-lg">
                      <span className="cursor-pointer">
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>

                {/* File Requirements */}
                <div className="bg-analyzer-elevated border border-analyzer-border rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-analyzer-warning mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium text-analyzer-text-primary mb-2">
                        File Requirements
                      </h4>
                      <ul className="text-sm text-analyzer-text-secondary space-y-1">
                        <li>• Valid .dmp or .mdmp file</li>
                        <li>• Maximum size: 500MB</li>
                        <li>• Windows crash dumps only</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-analyzer-surface border-analyzer-border p-6 text-center">
            <div className="w-12 h-12 bg-analyzer-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileType className="w-6 h-6 text-analyzer-accent" />
            </div>
            <h3 className="font-semibold text-analyzer-text-primary mb-2">
              Crash Analysis
            </h3>
            <p className="text-analyzer-text-secondary text-sm">
              Detailed exception information and crash root cause analysis
            </p>
          </Card>

          <Card className="bg-analyzer-surface border-analyzer-border p-6 text-center">
            <div className="w-12 h-12 bg-analyzer-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileType className="w-6 h-6 text-analyzer-success" />
            </div>
            <h3 className="font-semibold text-analyzer-text-primary mb-2">
              Stack Traces
            </h3>
            <p className="text-analyzer-text-secondary text-sm">
              Complete call stacks for all threads with symbol resolution
            </p>
          </Card>

          <Card className="bg-analyzer-surface border-analyzer-border p-6 text-center">
            <div className="w-12 h-12 bg-analyzer-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileType className="w-6 h-6 text-analyzer-warning" />
            </div>
            <h3 className="font-semibold text-analyzer-text-primary mb-2">
              Module Info
            </h3>
            <p className="text-analyzer-text-secondary text-sm">
              Loaded modules, versions, and memory addresses
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};