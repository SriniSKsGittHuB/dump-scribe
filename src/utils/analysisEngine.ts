import type { AnalysisData, CrashAnalysis, ThreadInfo, ModuleInfo, ExceptionInfo } from '@/types/dumpAnalysis';

export class AnalysisEngine {
  private static readonly CRASH_PATTERNS = {
    accessViolation: {
      keywords: ['0xC0000005', 'access violation', 'read', 'write', 'virtual address'],
      severity: 'critical' as const,
      commonCauses: [
        'Null pointer dereference',
        'Use after free',
        'Buffer overflow',
        'Uninitialized pointer',
        'Memory corruption'
      ]
    },
    stackOverflow: {
      keywords: ['0xC00000FD', 'stack overflow', 'stack'],
      severity: 'critical' as const,
      commonCauses: [
        'Infinite recursion',
        'Large local variables',
        'Deep call stack',
        'Stack corruption'
      ]
    },
    heapCorruption: {
      keywords: ['heap', 'corruption', '0xC0000374'],
      severity: 'critical' as const,
      commonCauses: [
        'Double free',
        'Buffer overrun',
        'Use after free',
        'Heap metadata corruption'
      ]
    },
    divideByZero: {
      keywords: ['0xC0000094', 'divide', 'zero'],
      severity: 'high' as const,
      commonCauses: [
        'Unvalidated input',
        'Logic error',
        'Missing bounds checking'
      ]
    }
  };

  private static readonly PROBLEMATIC_MODULES = [
    'unknown',
    'corrupted',
    'unsigned',
    'debug',
    'test'
  ];

  static analyzeData(data: AnalysisData): AnalysisData {
    const analysis = this.performCrashAnalysis(data);
    
    return {
      ...data,
      analysis
    };
  }

  private static performCrashAnalysis(data: AnalysisData): CrashAnalysis {
    const { exception, threads, modules } = data;
    
    // Detect crash pattern
    const crashPattern = this.detectCrashPattern(exception);
    
    // Analyze threads for deadlocks
    const deadlockDetected = this.detectDeadlocks(threads);
    
    // Check for memory corruption indicators
    const memoryCorruption = this.detectMemoryCorruption(exception, modules);
    
    // Check for stack overflow
    const stackOverflow = this.detectStackOverflow(exception, threads);
    
    // Find problematic modules
    const problemModules = this.findProblematicModules(modules, exception);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(crashPattern, deadlockDetected, memoryCorruption, stackOverflow, problemModules);
    
    // Calculate confidence based on available information
    const confidence = this.calculateConfidence(data);

    return {
      crashType: crashPattern.type,
      severity: crashPattern.severity,
      likelyRootCause: crashPattern.rootCause,
      confidence,
      recommendations,
      problemModules,
      deadlockDetected,
      memoryCorruption,
      stackOverflow
    };
  }

  private static detectCrashPattern(exception: ExceptionInfo) {
    const exceptionText = `${exception.code} ${exception.description}`.toLowerCase();
    
    for (const [patternName, pattern] of Object.entries(this.CRASH_PATTERNS)) {
      if (pattern.keywords.some(keyword => exceptionText.includes(keyword.toLowerCase()))) {
        return {
          type: this.formatCrashType(patternName),
          severity: pattern.severity,
          rootCause: pattern.commonCauses[0], // Most common cause
          possibleCauses: pattern.commonCauses
        };
      }
    }
    
    // Default case
    return {
      type: 'Unknown Exception',
      severity: 'medium' as const,
      rootCause: 'Unable to determine root cause from available information',
      possibleCauses: ['Insufficient debugging information', 'Complex interaction between components']
    };
  }

  private static detectDeadlocks(threads: ThreadInfo[]): boolean {
    // Simple deadlock detection: multiple threads waiting
    const waitingThreads = threads.filter(t => t.state === 'waiting' || t.state === 'blocked');
    
    // If more than half the threads are waiting, potential deadlock
    return waitingThreads.length > 1 && waitingThreads.length >= threads.length / 2;
  }

  private static detectMemoryCorruption(exception: ExceptionInfo, modules: ModuleInfo[]): boolean {
    // Check for corruption indicators
    const corruptionIndicators = [
      exception.code === '0xC0000005', // Access violation
      exception.code === '0xC0000374', // Heap corruption
      exception.description.toLowerCase().includes('corruption'),
      modules.some(m => m.name.toLowerCase().includes('unknown') || !m.hasSymbols)
    ];
    
    return corruptionIndicators.filter(Boolean).length >= 2;
  }

  private static detectStackOverflow(exception: ExceptionInfo, threads: ThreadInfo[]): boolean {
    if (exception.code === '0xC00000FD') {
      return true;
    }
    
    // Check for deep call stacks
    const mainThread = threads.find(t => t.isMainThread);
    if (mainThread && mainThread.stackTrace.length > 50) {
      return true;
    }
    
    return false;
  }

  private static findProblematicModules(modules: ModuleInfo[], exception: ExceptionInfo): string[] {
    const problematic: string[] = [];
    
    // Add the module where the exception occurred
    if (exception.module) {
      problematic.push(exception.module);
    }
    
    // Add modules without symbols
    modules.forEach(module => {
      if (!module.hasSymbols && !module.isSystemModule) {
        problematic.push(module.name);
      }
      
      // Check for other problematic indicators
      const nameCheck = module.name.toLowerCase();
      if (this.PROBLEMATIC_MODULES.some(pattern => nameCheck.includes(pattern))) {
        problematic.push(module.name);
      }
    });
    
    return [...new Set(problematic)]; // Remove duplicates
  }

  private static generateRecommendations(
    crashPattern: any,
    deadlockDetected: boolean,
    memoryCorruption: boolean,
    stackOverflow: boolean,
    problemModules: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Pattern-specific recommendations
    if (crashPattern.type.includes('Access Violation')) {
      recommendations.push('Review pointer usage and ensure proper null checks');
      recommendations.push('Use static analysis tools to detect potential buffer overflows');
      recommendations.push('Enable Application Verifier to catch heap corruption early');
    }
    
    if (stackOverflow) {
      recommendations.push('Review recursive function calls for proper termination conditions');
      recommendations.push('Consider reducing local variable sizes or moving to heap allocation');
      recommendations.push('Increase stack size if recursion depth is expected');
    }
    
    if (deadlockDetected) {
      recommendations.push('Review thread synchronization and lock ordering');
      recommendations.push('Consider using deadlock detection tools during development');
      recommendations.push('Implement timeout mechanisms for lock acquisitions');
    }
    
    if (memoryCorruption) {
      recommendations.push('Enable heap debugging features in debug builds');
      recommendations.push('Use memory debugging tools like Application Verifier');
      recommendations.push('Review memory allocation and deallocation patterns');
    }
    
    if (problemModules.length > 0) {
      recommendations.push(`Update or replace problematic modules: ${problemModules.join(', ')}`);
      recommendations.push('Ensure all third-party libraries are compatible with your application');
    }
    
    // General recommendations
    recommendations.push('Reproduce the issue in a controlled environment');
    recommendations.push('Enable crash dumps and logging for better diagnostics');
    recommendations.push('Update to the latest version of runtime libraries');
    
    return recommendations;
  }

  private static calculateConfidence(data: AnalysisData): number {
    let confidence = 0;
    
    // Base confidence from exception information
    if (data.exception.code && data.exception.code !== 'Unknown') {
      confidence += 30;
    }
    
    // Increase confidence if we have stack traces
    const threadsWithStacks = data.threads.filter(t => t.stackTrace.length > 0);
    confidence += Math.min(30, threadsWithStacks.length * 5);
    
    // Increase confidence if we have symbol information
    const modulesWithSymbols = data.modules.filter(m => m.hasSymbols);
    confidence += Math.min(25, (modulesWithSymbols.length / data.modules.length) * 25);
    
    // Increase confidence if crash occurred in known module
    if (data.exception.module && data.modules.find(m => m.name === data.exception.module)) {
      confidence += 15;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  private static formatCrashType(patternName: string): string {
    return patternName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Pattern detection for common issues
  static detectCommonPatterns(data: AnalysisData): Array<{
    pattern: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    found: boolean;
  }> {
    return [
      {
        pattern: 'Null Pointer Dereference',
        description: 'Access violation at address 0x00000000 or very low memory address',
        severity: 'critical',
        found: data.exception.address.endsWith('00000000') || 
               parseInt(data.exception.address, 16) < 0x10000
      },
      {
        pattern: 'Stack Corruption',
        description: 'Stack pointer or return address corruption detected',
        severity: 'critical',
        found: data.threads.some(t => 
          t.stackTrace.some(frame => 
            frame.address === '0x0000000000000000' || 
            frame.function.includes('unknown')
          )
        )
      },
      {
        pattern: 'Heap Corruption',
        description: 'Heap metadata corruption or invalid heap pointer',
        severity: 'critical',
        found: data.exception.code === '0xC0000374' ||
               data.exception.description.toLowerCase().includes('heap')
      },
      {
        pattern: 'Thread Deadlock',
        description: 'Multiple threads appear to be waiting indefinitely',
        severity: 'high',
        found: data.analysis.deadlockDetected
      },
      {
        pattern: 'Missing Symbols',
        description: 'Important modules lack debugging symbols',
        severity: 'medium',
        found: data.modules.filter(m => !m.hasSymbols && !m.isSystemModule).length > 0
      }
    ];
  }
}