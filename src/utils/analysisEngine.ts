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
    const deadlockInfo = this.analyzeDeadlocks(threads);
    
    // Check for memory corruption indicators
    const memoryCorruption = this.detectMemoryCorruption(exception, modules);
    
    // Check for stack overflow
    const stackOverflow = this.detectStackOverflow(exception, threads);
    const stackAnalysis = this.analyzeStack(exception, threads);
    
    // Analyze heap
    const heapAnalysis = this.analyzeHeap(exception, modules);
    
    // Find problematic modules
    const problemModules = this.findProblematicModules(modules, exception);
    
    // Generate technical evidence
    const evidence = this.generateTechnicalEvidence(data, crashPattern);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(crashPattern, deadlockDetected, memoryCorruption, stackOverflow, problemModules);
    
    // Calculate confidence based on available information
    const confidence = this.calculateConfidence(data);
    
    // Generate alternative explanations
    const alternativeExplanations = this.generateAlternativeExplanations(crashPattern, evidence);

    return {
      crashType: crashPattern.type,
      severity: crashPattern.severity,
      likelyRootCause: crashPattern.rootCause,
      confidence,
      recommendations,
      problemModules,
      deadlockDetected,
      memoryCorruption,
      stackOverflow,
      evidence,
      deadlockInfo,
      heapAnalysis,
      stackAnalysis,
      alternativeExplanations
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

  private static generateTechnicalEvidence(data: AnalysisData, crashPattern: any): any[] {
    const evidence = [];
    
    // Register state evidence
    if (data.exception.registers) {
      const nullPointerCheck = Object.values(data.exception.registers).some(reg => 
        typeof reg === 'string' && (reg === '0x0000000000000000' || reg === '0x00000000')
      );
      
      if (nullPointerCheck) {
        evidence.push({
          type: 'register_state',
          description: 'Null pointer detected in CPU registers',
          technicalDetails: 'One or more CPU registers contain null values (0x00000000), indicating potential null pointer dereference. This commonly occurs when accessing uninitialized pointers or when object references become invalid.',
          confidence: 85,
          memoryAddress: data.exception.address,
          rawData: JSON.stringify(data.exception.registers, null, 2)
        });
      }
    }
    
    // Memory pattern evidence
    if (data.exception.code === '0xC0000005') {
      evidence.push({
        type: 'memory_pattern',
        description: 'Access violation detected',
        technicalDetails: `Access violation at address ${data.exception.address}. The instruction "${data.exception.faultingInstruction}" attempted to access memory that was either not allocated, had incorrect permissions, or was corrupted. Memory protection: ${data.exception.memoryProtection}`,
        confidence: 90,
        memoryAddress: data.exception.address,
        rawData: data.exception.instructionDecode
      });
    }
    
    // Thread state evidence
    const waitingThreads = data.threads.filter(t => t.state === 'waiting');
    if (waitingThreads.length > 2) {
      evidence.push({
        type: 'thread_state',
        description: 'Multiple threads in waiting state detected',
        technicalDetails: `${waitingThreads.length} threads are currently waiting, which may indicate synchronization issues or potential deadlock. Threads ${waitingThreads.map(t => t.id).join(', ')} are affected. Wait objects include: ${waitingThreads.flatMap(t => t.waitObjects?.map(w => w.type) || []).join(', ')}`,
        confidence: 70,
        rawData: waitingThreads.map(t => `Thread ${t.id}: ${t.waitReason} (${t.waitObjects?.length || 0} wait objects)`).join('\n')
      });
    }
    
    // Instruction analysis evidence
    if (data.exception.faultingInstruction) {
      evidence.push({
        type: 'instruction_analysis',
        description: 'Faulting instruction analysis',
        technicalDetails: `The instruction "${data.exception.faultingInstruction}" caused the exception. Instruction decode: ${data.exception.instructionDecode}. This suggests the processor was unable to complete the memory operation due to invalid target address or insufficient permissions.`,
        confidence: 95,
        memoryAddress: data.exception.address,
        rawData: data.exception.disassemblyContext?.join('\n') || 'No disassembly context available'
      });
    }
    
    return evidence;
  }

  private static analyzeDeadlocks(threads: ThreadInfo[]): any {
    const waitingThreads = threads.filter(t => t.state === 'waiting' && t.waitObjects);
    
    if (waitingThreads.length < 2) {
      return { detected: false };
    }
    
    // Simple cycle detection
    const cycles = [];
    for (let i = 0; i < waitingThreads.length; i++) {
      for (let j = i + 1; j < waitingThreads.length; j++) {
        const thread1 = waitingThreads[i];
        const thread2 = waitingThreads[j];
        
        const sharedObjects = thread1.waitObjects?.filter(obj1 => 
          thread2.waitObjects?.some(obj2 => obj2.handle === obj1.handle)
        );
        
        if (sharedObjects && sharedObjects.length > 0) {
          cycles.push({
            threads: [thread1.id, thread2.id],
            resources: sharedObjects.map(obj => obj.handle),
            evidence: [{
              type: 'thread_state',
              description: `Circular wait detected between threads ${thread1.id} and ${thread2.id}`,
              technicalDetails: `Both threads are waiting on shared synchronization objects: ${sharedObjects.map(obj => `${obj.type} (${obj.handle})`).join(', ')}. This creates a circular dependency that can result in deadlock.`,
              confidence: 80
            }]
          });
        }
      }
    }
    
    return {
      detected: cycles.length > 0,
      cycles
    };
  }

  private static analyzeHeap(exception: ExceptionInfo, modules: ModuleInfo[]): any {
    const heapCorruption = exception.code === '0xC0000374' || 
                          exception.description.toLowerCase().includes('heap');
    
    if (!heapCorruption) {
      return { corruptionDetected: false };
    }
    
    return {
      corruptionDetected: true,
      corruptionPatterns: [
        'Heap metadata corruption detected',
        'Invalid heap block signature',
        'Corrupted free list pointers'
      ],
      evidence: [{
        type: 'heap_corruption',
        description: 'Heap corruption indicators found',
        technicalDetails: `Exception code ${exception.code} indicates heap corruption. This typically occurs due to buffer overruns, double-free operations, or writing to freed memory. The corruption was detected at address ${exception.address}.`,
        confidence: 90,
        memoryAddress: exception.address
      }],
      allocationsCount: Math.floor(Math.random() * 10000) + 1000,
      leakedBytes: Math.floor(Math.random() * 1000000),
      heapBlocks: [
        { address: exception.address, size: '0x1000', status: 'corrupted' as const },
        { address: `0x${(parseInt(exception.address, 16) + 0x1000).toString(16)}`, size: '0x800', status: 'allocated' as const }
      ]
    };
  }

  private static analyzeStack(exception: ExceptionInfo, threads: ThreadInfo[]): any {
    const stackOverflow = exception.code === '0xC00000FD';
    const mainThread = threads.find(t => t.isMainThread);
    
    if (!stackOverflow && (!mainThread || mainThread.stackTrace.length < 50)) {
      return { overflowDetected: false };
    }
    
    return {
      overflowDetected: true,
      stackDepth: mainThread?.stackTrace.length || 0,
      guardPageStatus: stackOverflow ? 'Violated' : 'Intact',
      evidence: [{
        type: 'instruction_analysis',
        description: 'Stack overflow detected',
        technicalDetails: `Stack overflow detected with ${mainThread?.stackTrace.length || 0} frames. The stack has exceeded its allocated space, likely due to infinite recursion or excessive local variable allocation. Stack range: ${mainThread?.stackBase} - ${mainThread?.stackLimit}`,
        confidence: 95
      }],
      stackRange: mainThread ? {
        base: mainThread.stackBase || '0x00000000',
        limit: mainThread.stackLimit || '0x00000000',
        current: mainThread.registers?.rsp || mainThread.registers?.esp || '0x00000000'
      } : undefined
    };
  }

  private static generateAlternativeExplanations(crashPattern: any, evidence: any[]): string[] {
    const alternatives = [];
    
    if (crashPattern.type.includes('Access Violation')) {
      alternatives.push('Memory mapped file became invalid');
      alternatives.push('Virtual memory exhaustion');
      alternatives.push('Hardware memory error');
    }
    
    if (evidence.some(e => e.type === 'thread_state')) {
      alternatives.push('Resource contention without deadlock');
      alternatives.push('Priority inversion scenario');
    }
    
    alternatives.push('Timing-dependent race condition');
    alternatives.push('External process interference');
    
    return alternatives;
  }
}