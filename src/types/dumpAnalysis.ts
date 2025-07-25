export interface DumpFile {
  name: string;
  size: number;
  uploadedAt: Date;
  type: 'minidump' | 'kernel' | 'full';
  architecture: 'x86' | 'x64' | 'arm64';
}

export interface MemoryRegion {
  startAddress: string;
  endAddress: string;
  size: string;
  protection: string;
  type: 'image' | 'mapped' | 'private' | 'reserved';
  contents?: string; // hex dump
}

export interface ExceptionInfo {
  code: string;
  address: string;
  description: string;
  module: string;
  function?: string;
  offset?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  registers?: RegisterState;
  faultingInstruction?: string;
  disassemblyContext?: string[];
  memoryRegions?: MemoryRegion[];
  instructionDecode?: string;
  memoryProtection?: string;
}

export interface RegisterState {
  eax?: string;
  ebx?: string;
  ecx?: string;
  edx?: string;
  esp?: string;
  ebp?: string;
  eip?: string;
  rax?: string;
  rbx?: string;
  rcx?: string;
  rdx?: string;
  rsp?: string;
  rbp?: string;
  rip?: string;
  flags?: string;
}

export interface WaitObject {
  type: 'mutex' | 'event' | 'critical_section' | 'semaphore' | 'unknown';
  handle: string;
  name?: string;
  ownerThread?: number;
  waitTime: number;
  address: string;
}

export interface StackFrame {
  address: string;
  module: string;
  function: string;
  offset: string;
  sourceFile?: string;
  lineNumber?: number;
  hasSymbols: boolean;
  framePointer?: string;
  instructionPointer?: string;
  parameters?: string[];
  locals?: Record<string, string>;
  disassembly?: string;
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
  registers?: RegisterState;
  waitObjects?: WaitObject[];
  stackBase?: string;
  stackLimit?: string;
  lastError?: string;
  teb?: string; // Thread Environment Block
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

export interface TechnicalEvidence {
  type: 'register_state' | 'memory_pattern' | 'instruction_analysis' | 'thread_state' | 'heap_corruption';
  description: string;
  technicalDetails: string;
  rawData?: string;
  confidence: number;
  memoryAddress?: string;
}

export interface DeadlockInfo {
  detected: boolean;
  cycles?: Array<{
    threads: number[];
    resources: string[];
    evidence: TechnicalEvidence[];
  }>;
}

export interface HeapAnalysis {
  corruptionDetected: boolean;
  corruptionPatterns?: string[];
  evidence?: TechnicalEvidence[];
  allocationsCount?: number;
  leakedBytes?: number;
  heapBlocks?: Array<{
    address: string;
    size: string;
    status: 'allocated' | 'free' | 'corrupted';
  }>;
}

export interface StackAnalysis {
  overflowDetected: boolean;
  stackDepth?: number;
  guardPageStatus?: string;
  evidence?: TechnicalEvidence[];
  stackRange?: {
    base: string;
    limit: string;
    current: string;
  };
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
  evidence: TechnicalEvidence[];
  deadlockInfo?: DeadlockInfo;
  heapAnalysis?: HeapAnalysis;
  stackAnalysis?: StackAnalysis;
  alternativeExplanations?: string[];
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