import type { AnalysisData, ThreadInfo, ModuleInfo, ExceptionInfo, CrashAnalysis } from '@/types/dumpAnalysis';

export class DumpParser {
  private static readonly MINIDUMP_SIGNATURE = 0x504D444D; // 'MDMP'
  private static readonly EXCEPTION_CODES: Record<string, string> = {
    '0xC0000005': 'Access Violation - The thread tried to read from or write to a virtual address for which it does not have the appropriate access.',
    '0xC0000017': 'No Memory - Not enough memory resources are available to complete this operation.',
    '0xC000001D': 'Illegal Instruction - The thread tried to execute an invalid instruction.',
    '0xC0000096': 'Privileged Instruction - The thread tried to execute an instruction whose operation is not allowed in the current machine mode.',
    '0xC00000FD': 'Stack Overflow - The thread used up its stack.',
    '0xC0000094': 'Integer Divide by Zero - The thread tried to divide an integer value by an integer divisor of zero.',
    '0xC000008C': 'Array Bounds Exceeded - The thread tried to access an array element that is out of bounds.',
    '0x80000003': 'Breakpoint - A breakpoint was encountered.',
    '0x80000004': 'Single Step - A trace trap or other single-instruction mechanism signaled that one instruction has been executed.',
    '0xC0000409': 'Stack Buffer Overrun - The system detected an overrun of a stack-based buffer in this application.'
  };

  static async parseFile(file: File): Promise<AnalysisData> {
    const buffer = await file.arrayBuffer();
    const dataView = new DataView(buffer);
    
    // Verify it's a valid dump file
    if (!this.isValidDumpFile(dataView)) {
      throw new Error('Invalid dump file format');
    }

    // Extract basic file info
    const fileInfo = this.extractFileInfo(file, dataView);
    
    // Parse system information
    const systemInfo = this.extractSystemInfo(dataView);
    
    // Parse process information
    const processInfo = this.extractProcessInfo(dataView);
    
    // Extract exception information
    const exception = this.extractExceptionInfo(dataView);
    
    // Extract thread information
    const threads = this.extractThreads(dataView);
    
    // Extract module information
    const modules = this.extractModules(dataView);
    
    // Generate statistics
    const statistics = this.generateStatistics(threads, modules);
    
    return {
      fileInfo,
      systemInfo,
      processInfo,
      exception,
      threads,
      modules,
      analysis: { 
        crashType: 'Unknown', 
        severity: 'medium', 
        likelyRootCause: 'Analysis pending...', 
        confidence: 0,
        recommendations: [],
        problemModules: [],
        deadlockDetected: false,
        memoryCorruption: false,
        stackOverflow: false
      },
      statistics
    };
  }

  private static isValidDumpFile(dataView: DataView): boolean {
    try {
      // Check for minidump signature
      const signature = dataView.getUint32(0, true);
      return signature === this.MINIDUMP_SIGNATURE;
    } catch {
      return false;
    }
  }

  private static extractFileInfo(file: File, dataView: DataView): any {
    // Mock implementation - in real scenario, would parse dump headers
    const architecture = Math.random() > 0.5 ? 'x64' : 'x86';
    const type = file.name.includes('kernel') ? 'kernel' : 
                 file.name.includes('full') ? 'full' : 'minidump';

    return {
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      type,
      architecture
    };
  }

  private static extractSystemInfo(dataView: DataView): any {
    // Mock system info - in real implementation would parse from dump
    return {
      osVersion: 'Windows 10 Pro (10.0.19041)',
      osServicePack: 'Build 19041',
      processorArchitecture: 'AMD64',
      processorCount: 8,
      totalMemory: '16.0 GB',
      availableMemory: '8.2 GB',
      pageSize: '4096 bytes'
    };
  }

  private static extractProcessInfo(dataView: DataView): any {
    // Mock process info
    const processNames = ['MyApplication.exe', 'TestApp.exe', 'GameEngine.exe', 'WebBrowser.exe'];
    const processName = processNames[Math.floor(Math.random() * processNames.length)];
    
    return {
      name: processName,
      id: Math.floor(Math.random() * 9999) + 1000,
      commandLine: `C:\\Program Files\\MyApp\\${processName}`,
      startTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      sessionId: 1,
      handleCount: Math.floor(Math.random() * 500) + 100,
      workingSetSize: `${Math.floor(Math.random() * 200) + 50} MB`,
      peakWorkingSetSize: `${Math.floor(Math.random() * 300) + 100} MB`,
      virtualSize: `${Math.floor(Math.random() * 500) + 200} MB`,
      peakVirtualSize: `${Math.floor(Math.random() * 600) + 300} MB`
    };
  }

  private static extractExceptionInfo(dataView: DataView): ExceptionInfo {
    // Simulate different exception types
    const exceptionCodes = Object.keys(this.EXCEPTION_CODES);
    const randomCode = exceptionCodes[Math.floor(Math.random() * exceptionCodes.length)];
    
    const modules = ['MyApplication.exe', 'ntdll.dll', 'kernel32.dll', 'user32.dll'];
    const functions = ['MainWindowProc', 'WinMain', 'CreateWindow', 'MessageLoop', 'DataProcessor'];
    
    return {
      code: randomCode,
      address: `0x${Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).toUpperCase().padStart(12, '0')}`,
      description: this.EXCEPTION_CODES[randomCode],
      module: modules[Math.floor(Math.random() * modules.length)],
      function: functions[Math.floor(Math.random() * functions.length)],
      offset: `+0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase()}`,
      severity: randomCode === '0xC0000005' || randomCode === '0xC00000FD' ? 'critical' : 'high'
    };
  }

  private static extractThreads(dataView: DataView): ThreadInfo[] {
    const threadCount = Math.floor(Math.random() * 8) + 3; // 3-10 threads
    const threads: ThreadInfo[] = [];
    
    const threadStates: ThreadInfo['state'][] = ['running', 'waiting', 'blocked', 'suspended'];
    const waitReasons = ['UserRequest', 'Executive', 'FreePage', 'PageIn', 'PoolAllocation', 'DelayExecution'];
    
    for (let i = 0; i < threadCount; i++) {
      const isMainThread = i === 0;
      const state = isMainThread ? 'running' : threadStates[Math.floor(Math.random() * threadStates.length)];
      
      threads.push({
        id: i,
        name: isMainThread ? 'Main Thread' : i === 1 ? 'Worker Thread' : undefined,
        state,
        priority: Math.floor(Math.random() * 31),
        stackTrace: this.generateStackTrace(),
        cpu: Math.floor(Math.random() * 8),
        kernelTime: Math.floor(Math.random() * 1000),
        userTime: Math.floor(Math.random() * 5000),
        waitReason: state === 'waiting' ? waitReasons[Math.floor(Math.random() * waitReasons.length)] : undefined,
        isMainThread
      });
    }
    
    return threads;
  }

  private static generateStackTrace(): any[] {
    const frameCount = Math.floor(Math.random() * 15) + 5; // 5-20 frames
    const frames = [];
    
    const modules = [
      'MyApplication.exe', 'ntdll.dll', 'kernel32.dll', 'user32.dll', 
      'msvcrt.dll', 'ole32.dll', 'shell32.dll', 'advapi32.dll'
    ];
    
    const functions = [
      'main', 'WinMain', 'CreateWindow', 'DefWindowProc', 'GetMessage',
      'DispatchMessage', 'LoadLibrary', 'GetProcAddress', 'malloc',
      'free', 'strcpy', 'printf', 'MessageBox', 'RegOpenKey'
    ];
    
    for (let i = 0; i < frameCount; i++) {
      const module = modules[Math.floor(Math.random() * modules.length)];
      const isSystemModule = module !== 'MyApplication.exe';
      
      frames.push({
        address: `0x${Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).toUpperCase().padStart(12, '0')}`,
        module,
        function: functions[Math.floor(Math.random() * functions.length)],
        offset: `+0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase()}`,
        hasSymbols: Math.random() > 0.3,
        sourceFile: !isSystemModule && Math.random() > 0.5 ? 'main.cpp' : undefined,
        lineNumber: !isSystemModule && Math.random() > 0.5 ? Math.floor(Math.random() * 1000) + 1 : undefined
      });
    }
    
    return frames;
  }

  private static extractModules(dataView: DataView): ModuleInfo[] {
    const systemModules = [
      { name: 'ntdll.dll', company: 'Microsoft Corporation', description: 'NT Layer DLL' },
      { name: 'kernel32.dll', company: 'Microsoft Corporation', description: 'Windows NT BASE API Client DLL' },
      { name: 'user32.dll', company: 'Microsoft Corporation', description: 'Multi-User Windows USER API Client DLL' },
      { name: 'gdi32.dll', company: 'Microsoft Corporation', description: 'GDI Client DLL' },
      { name: 'msvcrt.dll', company: 'Microsoft Corporation', description: 'Microsoft® C Runtime Library' },
      { name: 'ole32.dll', company: 'Microsoft Corporation', description: 'Microsoft OLE for Windows' },
      { name: 'shell32.dll', company: 'Microsoft Corporation', description: 'Windows Shell Common Dll' },
      { name: 'advapi32.dll', company: 'Microsoft Corporation', description: 'Advanced Windows 32 Base API' }
    ];

    const appModules = [
      { name: 'MyApplication.exe', company: 'Your Company', description: 'Main Application' },
      { name: 'AppCore.dll', company: 'Your Company', description: 'Application Core Library' },
      { name: 'DataLayer.dll', company: 'Your Company', description: 'Data Access Layer' }
    ];

    const allModules = [...systemModules, ...appModules];
    const moduleCount = Math.floor(Math.random() * 20) + 15; // 15-35 modules
    
    const modules: ModuleInfo[] = [];
    
    for (let i = 0; i < Math.min(moduleCount, allModules.length); i++) {
      const moduleTemplate = allModules[i % allModules.length];
      const baseAddr = 0x7FF000000000 + (i * 0x10000000);
      const size = Math.floor(Math.random() * 0x500000) + 0x10000;
      
      modules.push({
        name: moduleTemplate.name,
        baseAddress: `0x${baseAddr.toString(16).toUpperCase()}`,
        endAddress: `0x${(baseAddr + size).toString(16).toUpperCase()}`,
        size: `0x${size.toString(16).toUpperCase()}`,
        version: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 9999)}.${Math.floor(Math.random() * 99)}`,
        description: moduleTemplate.description,
        company: moduleTemplate.company,
        path: `C:\\${moduleTemplate.company === 'Microsoft Corporation' ? 'Windows\\System32' : 'Program Files\\MyApp'}\\${moduleTemplate.name}`,
        imageType: moduleTemplate.name.endsWith('.exe') ? 'exe' : 'dll',
        hasSymbols: Math.random() > 0.4,
        checksum: Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase(),
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        isSystemModule: moduleTemplate.company === 'Microsoft Corporation'
      });
    }
    
    return modules.sort((a, b) => a.name.localeCompare(b.name));
  }

  private static generateStatistics(threads: ThreadInfo[], modules: ModuleInfo[]) {
    return {
      totalThreads: threads.length,
      runningThreads: threads.filter(t => t.state === 'running').length,
      waitingThreads: threads.filter(t => t.state === 'waiting').length,
      totalModules: modules.length,
      systemModules: modules.filter(m => m.isSystemModule).length,
      thirdPartyModules: modules.filter(m => !m.isSystemModule).length,
      modulesWithSymbols: modules.filter(m => m.hasSymbols).length
    };
  }
}