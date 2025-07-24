import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { Dashboard } from './Dashboard';

export interface DumpFile {
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface AnalysisData {
  crashSummary: {
    exceptionCode: string;
    exceptionAddress: string;
    processName: string;
    processId: number;
    timestamp: string;
    crashType: string;
  };
  exception: {
    type: string;
    message: string;
    address: string;
    module: string;
    function: string;
  };
  threads: Array<{
    id: number;
    name: string;
    state: string;
    stackTrace: Array<{
      address: string;
      module: string;
      function: string;
      offset: string;
    }>;
  }>;
  modules: Array<{
    name: string;
    baseAddress: string;
    size: string;
    version: string;
    path: string;
  }>;
}

const MemoryDumpAnalyzer: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<DumpFile | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    
    // Simulate file analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dumpFile: DumpFile = {
      name: file.name,
      size: file.size,
      uploadedAt: new Date()
    };

    // Mock analysis data
    const mockData: AnalysisData = {
      crashSummary: {
        exceptionCode: "0xC0000005",
        exceptionAddress: "0x00007FF123456789",
        processName: "MyApplication.exe",
        processId: 4532,
        timestamp: new Date().toISOString(),
        crashType: "Access Violation"
      },
      exception: {
        type: "EXCEPTION_ACCESS_VIOLATION",
        message: "The thread tried to read from or write to a virtual address for which it does not have the appropriate access.",
        address: "0x00007FF123456789",
        module: "MyApplication.exe",
        function: "MainWindowProc"
      },
      threads: [
        {
          id: 0,
          name: "Main Thread",
          state: "Running",
          stackTrace: [
            {
              address: "0x00007FF123456789",
              module: "MyApplication.exe",
              function: "MainWindowProc",
              offset: "+0x123"
            },
            {
              address: "0x00007FFD12345678",
              module: "user32.dll",
              function: "DispatchMessageW",
              offset: "+0x45"
            },
            {
              address: "0x00007FF123456234",
              module: "MyApplication.exe",
              function: "WinMain",
              offset: "+0x67"
            }
          ]
        },
        {
          id: 1,
          name: "Worker Thread",
          state: "Waiting",
          stackTrace: [
            {
              address: "0x00007FFD12349876",
              module: "ntdll.dll",
              function: "NtWaitForSingleObject",
              offset: "+0x14"
            }
          ]
        }
      ],
      modules: [
        {
          name: "MyApplication.exe",
          baseAddress: "0x00007FF123450000",
          size: "0x12000",
          version: "1.0.0.0",
          path: "C:\\Program Files\\MyApp\\MyApplication.exe"
        },
        {
          name: "ntdll.dll",
          baseAddress: "0x00007FFD12340000",
          size: "0x1F8000",
          version: "10.0.19041.1",
          path: "C:\\Windows\\System32\\ntdll.dll"
        },
        {
          name: "kernel32.dll",
          baseAddress: "0x00007FFD11F40000",
          size: "0x123000",
          version: "10.0.19041.1",
          path: "C:\\Windows\\System32\\kernel32.dll"
        }
      ]
    };

    setCurrentFile(dumpFile);
    setAnalysisData(mockData);
    setIsAnalyzing(false);
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