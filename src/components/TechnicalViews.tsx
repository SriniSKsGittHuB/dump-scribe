import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Cpu, MemoryStick, Bug, HardDrive } from 'lucide-react';
import type { RegisterState, MemoryRegion, TechnicalEvidence, StackFrame } from '@/types/dumpAnalysis';

interface RegisterViewerProps {
  registers?: RegisterState;
}

export function RegisterViewer({ registers }: RegisterViewerProps) {
  if (!registers) return null;

  const registerEntries = Object.entries(registers);
  const generalPurpose = registerEntries.filter(([key]) => 
    ['eax', 'ebx', 'ecx', 'edx', 'rax', 'rbx', 'rcx', 'rdx'].includes(key)
  );
  const pointers = registerEntries.filter(([key]) => 
    ['esp', 'ebp', 'eip', 'rsp', 'rbp', 'rip'].includes(key)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Register State
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-3 text-muted-foreground">General Purpose</h4>
            <div className="space-y-2">
              {generalPurpose.map(([reg, value]) => (
                <div key={reg} className="flex justify-between items-center font-mono text-sm">
                  <span className="text-primary font-medium">{reg.toUpperCase()}:</span>
                  <span className="bg-muted px-2 py-1 rounded">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-muted-foreground">Pointers & Control</h4>
            <div className="space-y-2">
              {pointers.map(([reg, value]) => (
                <div key={reg} className="flex justify-between items-center font-mono text-sm">
                  <span className="text-primary font-medium">{reg.toUpperCase()}:</span>
                  <span className="bg-muted px-2 py-1 rounded">{value}</span>
                </div>
              ))}
              {registers.flags && (
                <div className="flex justify-between items-center font-mono text-sm">
                  <span className="text-primary font-medium">FLAGS:</span>
                  <span className="bg-muted px-2 py-1 rounded">{registers.flags}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HexDumpViewerProps {
  data: string;
  startAddress: string;
  title?: string;
}

export function HexDumpViewer({ data, startAddress, title = "Memory Contents" }: HexDumpViewerProps) {
  const [showAscii, setShowAscii] = useState(true);
  
  const formatHexDump = (hexData: string, baseAddr: string) => {
    const bytes = hexData.match(/.{1,2}/g) || [];
    const lines = [];
    const baseAddress = parseInt(baseAddr, 16);
    
    for (let i = 0; i < bytes.length; i += 16) {
      const lineBytes = bytes.slice(i, i + 16);
      const address = (baseAddress + i).toString(16).toUpperCase().padStart(8, '0');
      const hex = lineBytes.join(' ').padEnd(47, ' ');
      
      let ascii = '';
      if (showAscii) {
        ascii = lineBytes.map(byte => {
          const char = parseInt(byte, 16);
          return (char >= 32 && char <= 126) ? String.fromCharCode(char) : '.';
        }).join('');
      }
      
      lines.push({ address, hex, ascii });
    }
    
    return lines;
  };

  const lines = formatHexDump(data, startAddress);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAscii(!showAscii)}
          >
            {showAscii ? 'Hide ASCII' : 'Show ASCII'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black/90 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
          <div className="space-y-1">
            {lines.map((line, index) => (
              <div key={index} className="flex gap-4">
                <span className="text-blue-300">{line.address}:</span>
                <span className="flex-1">{line.hex}</span>
                {showAscii && (
                  <span className="text-yellow-300">|{line.ascii}|</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DisassemblyViewerProps {
  instructions: string[];
  faultingAddress?: string;
}

export function DisassemblyViewer({ instructions, faultingAddress }: DisassemblyViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Disassembly Context
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-black/90 text-gray-300 p-4 rounded font-mono text-sm overflow-x-auto">
          <div className="space-y-1">
            {instructions.map((instruction, index) => {
              const isFaulting = faultingAddress && instruction.includes(faultingAddress);
              return (
                <div
                  key={index}
                  className={`flex gap-4 ${isFaulting ? 'bg-red-900/50 text-red-300' : ''}`}
                >
                  {isFaulting && <span className="text-red-500">→</span>}
                  <span className="text-blue-300 min-w-[100px]">
                    {instruction.split(' ')[0]}:
                  </span>
                  <span className="flex-1">
                    {instruction.substring(instruction.indexOf(' ') + 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TechnicalEvidenceViewerProps {
  evidence: TechnicalEvidence[];
}

export function TechnicalEvidenceViewer({ evidence }: TechnicalEvidenceViewerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getEvidenceIcon = (type: TechnicalEvidence['type']) => {
    switch (type) {
      case 'register_state': return <Cpu className="h-4 w-4" />;
      case 'memory_pattern': return <MemoryStick className="h-4 w-4" />;
      case 'instruction_analysis': return <Bug className="h-4 w-4" />;
      case 'thread_state': return <HardDrive className="h-4 w-4" />;
      case 'heap_corruption': return <MemoryStick className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Evidence & Reasoning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {evidence.map((item, index) => (
            <Collapsible
              key={index}
              open={expandedItems.has(index)}
              onOpenChange={() => toggleItem(index)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getEvidenceIcon(item.type)}
                    <div className="text-left">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        Confidence: 
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(item.confidence)}`} />
                          {item.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>
                  {expandedItems.has(index) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-4 pl-11 space-y-3">
                  <div>
                    <h5 className="font-medium text-sm mb-2">Technical Analysis:</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.technicalDetails}
                    </p>
                  </div>
                  
                  {item.memoryAddress && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Memory Address:</h5>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {item.memoryAddress}
                      </code>
                    </div>
                  )}
                  
                  {item.rawData && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Raw Data:</h5>
                      <div className="bg-black/90 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                        {item.rawData}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AdvancedStackFrameProps {
  frame: StackFrame;
  index: number;
}

export function AdvancedStackFrame({ frame, index }: AdvancedStackFrameProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto hover:bg-muted/50"
        >
          <div className="text-left font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">#{index}</span>
              <span className="text-primary">{frame.address}</span>
              <span>{frame.module}</span>
              <Badge variant="outline" className="ml-2">
                {frame.function}
              </Badge>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Frame Pointer:</span>
              <code className="ml-2 bg-muted px-1 rounded">
                {frame.framePointer || 'N/A'}
              </code>
            </div>
            <div>
              <span className="font-medium">Instruction Pointer:</span>
              <code className="ml-2 bg-muted px-1 rounded">
                {frame.instructionPointer || 'N/A'}
              </code>
            </div>
          </div>
          
          {frame.parameters && frame.parameters.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Parameters:</h5>
              <div className="space-y-1">
                {frame.parameters.map((param, i) => (
                  <div key={i} className="font-mono text-xs bg-muted p-2 rounded">
                    {param}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {frame.locals && Object.keys(frame.locals).length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Local Variables:</h5>
              <div className="space-y-1">
                {Object.entries(frame.locals).map(([name, value]) => (
                  <div key={name} className="font-mono text-xs bg-muted p-2 rounded flex justify-between">
                    <span className="text-primary">{name}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {frame.disassembly && (
            <div>
              <h5 className="font-medium mb-2">Disassembly:</h5>
              <div className="bg-black/90 text-green-400 p-3 rounded font-mono text-xs">
                {frame.disassembly}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}