import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import CodeEditor from './CodeEditor';
import { ValidationResult } from '../types/validator';
import ErrorBoundary from './ErrorBoundary';
import CopyButton from './CopyButton';
import Tooltip from './Tooltip';

interface LLVMIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  cppIR: string;
  rustIR: string;
  validationResult: ValidationResult | null;
  isValidating: boolean;
}

// Technical terms tooltips
export const technicalTerms: Record<string, string> = {
  'noundef': 'Indicates that the value cannot be undefined',
  'i32': '32-bit integer type',
  'ptr': 'Pointer type',
  'alloc': 'Memory allocation instruction',
  'align': 'Memory alignment specification',
  'offset': 'Memory address offset',
  'block_id': 'Identifier for a memory block',
  'address': 'Memory location',
  'const': 'Constant value',
  'alive': 'Indicates if memory block is still in use',
  'poison': 'Represents undefined behavior',
  'UB': 'Undefined Behavior - unpredictable program behavior',
  '_ZN': 'Rust name mangling prefix',
  '_Z': 'C++ name mangling prefix',
  'Function': 'Function declaration or definition',
  'triggered UB': 'Function execution resulted in Undefined Behavior',
  'panic': 'Rust panic handler function',
  'core': 'Rust core library function',
  'Jump to': 'Branch instruction to a labeled block',
};

// Update the formatVerifierOutput function
const formatVerifierOutput = (output: string) => {
  const sections: { [key: string]: string[] } = {
    main: [],
    source: [],
    target: [],
    memory: []
  };
  
  const lines = output.split('\n');
  let currentSection = 'main';
  
  lines.forEach(line => {
    // Update section detection logic
    if (line.startsWith('ERROR:') || line.includes("Transformation doesn't verify")) {
      currentSection = 'main';
    } else if (line.startsWith('Source:')) {
      currentSection = 'source';
      return; // Skip the section header line
    } else if (line.startsWith('Target:')) {
      currentSection = 'target';
      return; // Skip the section header line
    } else if (line.includes('SOURCE MEMORY STATE')) {
      currentSection = 'memory';
    }
    sections[currentSection].push(line);
  });
  
  return sections;
};

// Add new TooltipPortal component
const TooltipPortal = memo(({ content, children }: { content: string, children: React.ReactNode }) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.createElement('div');
    element.className = 'tooltip-portal';
    document.body.appendChild(element);
    setPortalElement(element);

    return () => {
      document.body.removeChild(element);
    };
  }, []);

  if (!portalElement) return null;

  return createPortal(
    <Tooltip content={content}>{children}</Tooltip>,
    portalElement
  );
});

TooltipPortal.displayName = 'TooltipPortal';

// Memoize the IR display section
const IRDisplay = memo(({ cppIR, rustIR }: { cppIR: string; rustIR: string }) => (
  <div className="grid grid-cols-2 gap-6 mb-6">
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-3">C++ LLVM IR</h4>
      <ErrorBoundary>
        <div className="h-[400px]">
          <CodeEditor
            language="llvm"
            value={cppIR}
            onChange={() => {}}
            readOnly={true}
            showCopyButton={true}
          />
        </div>
      </ErrorBoundary>
    </div>
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-3">Rust LLVM IR</h4>
      <ErrorBoundary>
        <div className="h-[400px]">
          <CodeEditor
            language="llvm"
            value={rustIR}
            onChange={() => {}}
            readOnly={true}
            showCopyButton={true}
          />
        </div>
      </ErrorBoundary>
    </div>
  </div>
));

IRDisplay.displayName = 'IRDisplay';

// Create a TooltipWrapper component to handle individual tooltips
const TooltipWrapper = memo(({ term, tooltip, children }: { 
  term: string; 
  tooltip: string; 
  children: React.ReactNode;
}) => {
  return (
    <Tooltip content={tooltip}>
      <span className="cursor-help border-b border-dotted border-gray-400">
        {children}
      </span>
    </Tooltip>
  );
});

TooltipWrapper.displayName = 'TooltipWrapper';

// Create a Line component to handle individual line rendering
const Line = memo(({ content }: { content: string }) => {
  // Handle special cases first
  if (content.includes('ERROR:')) {
    return (
      <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
        <span className="text-rose-600 font-bold">ERROR:</span>
        <span className="text-gray-800">{content.split('ERROR:')[1]}</span>
      </div>
    );
  }

  if (content.includes("Transformation doesn't verify")) {
    return (
      <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
        <span className="text-rose-600 font-semibold">{content}</span>
      </div>
    );
  }

  if (content.match(/^Example:/)) {
    return (
      <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
        <span className="text-gray-800 font-semibold">{content}</span>
      </div>
    );
  }

  if (content.match(/^(SOURCE MEMORY STATE|LOCAL BLOCKS|NON-LOCAL BLOCKS):$/)) {
    return (
      <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
        <span className="text-blue-600 font-bold">{content}</span>
      </div>
    );
  }

  // Handle function-related lines specifically
  if (content.includes('Function @') || content.match(/^@[_A-Za-z]/)) {
    const functionMatch = content.match(/@([_A-Za-z0-9]+)/);
    const functionName = functionMatch?.[1];
    
    if (functionName) {
      let tooltip = '';

      // Determine the type of function and create appropriate tooltip
      if (functionName.startsWith('_ZN')) {
        tooltip = 'Rust mangled function name';
        if (functionName.includes('panic')) {
          tooltip += ' (Panic handler)';
        } else if (functionName.includes('core')) {
          tooltip += ' (Core library function)';
        }
      } else if (functionName.startsWith('_Z')) {
        tooltip = 'C++ mangled function name';
      }

      return (
        <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
          <span>Function </span>
          <Tooltip content={tooltip}>
            <span className="text-emerald-600 font-semibold cursor-help border-b border-dotted border-emerald-300">
              @{functionName}
            </span>
          </Tooltip>
          {content.includes('triggered UB') && (
            <>
              <span> </span>
              <Tooltip content="Function execution resulted in Undefined Behavior">
                <span className="text-rose-600 cursor-help border-b border-dotted border-rose-300">
                  triggered UB
                </span>
              </Tooltip>
            </>
          )}
        </div>
      );
    }
  }

  // Handle jump/branch instructions
  if (content.startsWith('>>')) {
    const jumpMatch = content.match(/>>\s*Jump to\s*(%\w+)/);
    if (jumpMatch) {
      return (
        <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
          <span className="text-blue-500">{'>>'}</span>
          <Tooltip content="Branch instruction to a labeled block">
            <span className="cursor-help border-b border-dotted border-gray-400"> Jump to </span>
          </Tooltip>
          <span className="text-purple-600">{jumpMatch[1]}</span>
        </div>
      );
    }
  }

  // Update the parts splitting regex to include function names
  const parts = content.split(/((?:\b(?:i32|ptr|noundef)\b)|(?:%#?\d+)|(?:@[_A-Za-z0-9]+)|(?:#x[0-9a-fA-F]+(?:\([^)]+\))?)|(?:block_id=\d+)|(?:offset=\d+)|(?:Address=#x[0-9a-fA-F]+))/g);

  return (
    <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
      {parts.map((part, index) => {
        // Handle technical terms
        if (technicalTerms[part] || part === 'i32' || part === 'ptr') {
          const tooltip = technicalTerms[part] || 
            (part === 'i32' ? '32-bit integer type' : 
             part === 'ptr' ? 'Pointer type' : undefined);
          
          return (
            <Tooltip key={index} content={tooltip || ''}>
              <span className="cursor-help border-b border-dotted border-gray-400">
                {part}
              </span>
            </Tooltip>
          );
        }

        // Handle variables
        if (part.startsWith('%')) {
          return <span key={index} className="text-purple-600">{part}</span>;
        }

        // Handle block_id and offset
        if (part.startsWith('block_id=') || part.startsWith('offset=')) {
          const [label, value] = part.split('=');
          return (
            <span key={index}>
              {label}=<span className="text-amber-600">{value}</span>
            </span>
          );
        }

        // Handle hex values
        if (part.startsWith('#x')) {
          const match = part.match(/#x([0-9a-fA-F]+)(?:\(([^)]+)\))?/);
          if (match) {
            return (
              <span key={index}>
                #x<span className="text-orange-600">{match[1]}</span>
                {match[2] && (
                  <span>
                    (<span className="text-amber-600">{match[2]}</span>)
                  </span>
                )}
              </span>
            );
          }
        }

        // Handle function names
        if (part.startsWith('@')) {
          const functionName = part.slice(1);
          let tooltip = '';
          
          if (functionName.startsWith('_ZN')) {
            tooltip = 'Rust mangled function name';
          } else if (functionName.startsWith('_Z')) {
            tooltip = 'C++ mangled function name';
          }

          if (tooltip) {
            return (
              <Tooltip key={index} content={tooltip}>
                <span className="text-emerald-600 font-semibold cursor-help border-b border-dotted border-emerald-300">
                  {part}
                </span>
              </Tooltip>
            );
          }
        }

        // Return plain text for other parts
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
});

Line.displayName = 'Line';

// Update ValidationOutput to use the Line component
const ValidationOutput = memo(({ sections }: { sections: { [key: string]: string[] } }) => {
  return (
    <div className="space-y-6">
      {Object.entries(sections).map(([sectionKey, lines]) => {
        if (lines.length === 0) return null;
  
        const sectionInfo = {
          main: {
            title: 'Validation Output',
            description: 'Main validation results and error messages',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          },
          source: {
            title: 'Source Program',
            description: 'The original C++ program in LLVM IR form',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          },
          target: {
            title: 'Target Program',
            description: 'The translated Rust program in LLVM IR form',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          },
          memory: {
            title: 'Memory State',
            description: 'Analysis of program memory layout and usage',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        }[sectionKey];
  
        if (!sectionInfo) return null;
  
        return (
          <div key={sectionKey} className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
              <Tooltip content={sectionInfo.description}>
                <div className="flex items-center space-x-2 cursor-help">
                  {sectionInfo.icon}
                  <span>{sectionInfo.title}</span>
                </div>
              </Tooltip>
            </div>
            <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {lines.map((line, idx) => (
                <Line key={idx} content={line} />
              ))}
            </pre>
          </div>
        );
      })}
    </div>
  );
});

ValidationOutput.displayName = 'ValidationOutput';

export default function LLVMIRModal({
  isOpen,
  onClose,
  cppIR,
  rustIR,
  validationResult,
  isValidating
}: LLVMIRModalProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Save scroll position before any state updates
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after any state updates
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = scrollPosition;
  }, [scrollPosition, validationResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 transition-opacity duration-300 bg-gray-500 bg-opacity-75" 
          onClick={onClose} 
        />

        <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-xl overflow-hidden animate-modal-slide-in">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white border-b">
            <div className="flex justify-between items-center p-6">
              <h3 className="text-2xl font-semibold text-gray-900 animate-fade-in">LLVM IR Generation</h3>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content with ref */}
          <div 
            ref={scrollContainerRef}
            className="p-6 pb-20 max-h-[calc(100vh-200px)] overflow-y-auto smooth-scroll"
          >
            <IRDisplay cppIR={cppIR} rustIR={rustIR} />

            {isValidating ? (
              <div className="flex items-center justify-center py-4 animate-fade-in">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-gray-600">Validating translation...</span>
              </div>
            ) : validationResult && (
              <div ref={resultsRef} className="animate-fade-in">
                <div className={`p-6 rounded-xl backdrop-blur-sm ${
                  validationResult.success 
                    ? 'bg-green-50/80 border border-green-200' 
                    : 'bg-red-50/80 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      {validationResult.success ? (
                        <div className="flex items-center text-green-800">
                          <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          </svg>
                          <span className="text-xl font-medium">Translation Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-800">
                          <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                          </svg>
                          <span className="text-xl font-medium">Verification Failed</span>
                        </div>
                      )}
                    </div>
                    <CopyButton 
                      text={validationResult.verifier_output} 
                      label="Copy Output" 
                    />
                  </div>

                  <ValidationOutput 
                    sections={formatVerifierOutput(validationResult.verifier_output)} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
