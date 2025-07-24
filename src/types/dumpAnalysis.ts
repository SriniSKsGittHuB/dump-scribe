export interface DumpFile {
  name: string;
  size: number;
  uploadedAt: Date;
  type: 'minidump' | 'kernel' | 'full';
  architecture: 'x86' | 'x64' | 'arm64';
}

export interface ExceptionInfo {
  code: string;
  address: string;
  description: string;
  module: string;
  function?: string;
  offset?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface StackFrame {
  address: string;
  module: string;
  function: string;
  offset: string;
  sourceFile?: string;
  lineNumber?: number;
  hasSymbols: boolean;
}

export interface ThreadInfo {
  id: number;
  name?: string;
  state: 'running' | 'waiting' | 'blocked' | 'terminated' | 'suspended';
  priority: number;
  stackTrace: StackFrame[];
  cpu: number;
  kernelTime: number;
  userTime: number;
  waitReason?: string;
  isMainThread: boolean;
}

export interface ModuleInfo {
  name: string;
  baseAddress: string;
  endAddress: string;
  size: string;
  version: string;
  description: string;
  company: string;
  path: string;
  imageType: 'exe' | 'dll' | 'sys' | 'ocx' | 'unknown';
  hasSymbols: boolean;
  checksum: string;
  timestamp: string;
  isSystemModule: boolean;
}

export interface SystemInfo {
  osVersion: string;
  osServicePack: string;
  processorArchitecture: string;
  processorCount: number;
  totalMemory: string;
  availableMemory: string;
  pageSize: string;
}

export interface ProcessInfo {
  name: string;
  id: number;
  commandLine: string;
  startTime: string;
  sessionId: number;
  handleCount: number;
  workingSetSize: string;
  peakWorkingSetSize: string;
  virtualSize: string;
  peakVirtualSize: string;
}

export interface CrashAnalysis {
  crashType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelyRootCause: string;
  confidence: number;
  recommendations: string[];
  problemModules: string[];
  deadlockDetected: boolean;
  memoryCorruption: boolean;
  stackOverflow: boolean;
}

export interface AnalysisData {
  fileInfo: DumpFile;
  systemInfo: SystemInfo;
  processInfo: ProcessInfo;
  exception: ExceptionInfo;
  threads: ThreadInfo[];
  modules: ModuleInfo[];
  analysis: CrashAnalysis;
  statistics: {
    totalThreads: number;
    runningThreads: number;
    waitingThreads: number;
    totalModules: number;
    systemModules: number;
    thirdPartyModules: number;
    modulesWithSymbols: number;
  };
}