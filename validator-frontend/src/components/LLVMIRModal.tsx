import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
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

// technical terms tooltips
export const technicalTerms: Record<string, string> = {
  'noundef': 'value cannot be undefined',
  'i32': '32-bit integer type',
  'ptr': 'pointer type',
  'align': 'memory alignment requirement',
  'define': 'declare a function with definition',
  'declare': 'declare a function without definition',
  'extractvalue': 'extract a member from an aggregate value',
  'assume': 'tell optimizer to assume a condition is true',
  'call': 'call a function',
  'UB': 'Undefined Behavior in language specification',
  'gep': 'computes address of a subelement in an aggregate data structure',
  'inbounds': 'indicates pointer arithmetic will not overflow or go out of bounds',
  'noreturn': 'function never returns to caller',
  'offset': 'memory address offset',
  'block_id': 'memory block identifier',
  'address': 'memory location',
  'local': 'memory block allocated in current function\'s stack frame',
  'non-local': 'memory block allocated outside current function\'s stack frame',
  'const': 'constant value',
  'alive': 'memory block is still in use',
  'poison': 'value that causes undefined behavior when used in computations',
  'store': 'store value to memory location',
  'load': 'load value from memory location',
  'br': 'branch to different basic block',
  'ret': 'return value from function',
  'label': 'basic block identifier',
  'switch': 'multi-way branch based on value',
  'ule': 'unsigned less-than-or-equal comparison',
  'uge': 'unsigned greater-than-or-equal comparison',
  'ult': 'unsigned less-than comparison',
  'ugt': 'unsigned greater-than comparison',
  'icmp': 'integer comparison',
  'fcmp': 'floating-point comparison',
  'phi': 'select value based on predecessor block',
  'alloca': 'allocate memory on stack',
  'sext': 'extends a smaller integer to a larger one by copying the sign bit',
  'zext': 'extends a smaller integer to a larger one by padding with zeros',
  'trunc': 'converts a larger integer to a smaller one by dropping high-order bits',
  'signext': 'extends a smaller integer to a larger one by copying the sign bit',
};

// create a proper interface for sections
interface ValidationSections {
  main: string[];
  source: string[];
  target: string[];
  error: string[];
  alive2_source: string[];
  alive2_target: string[];
  example: string[];
  success: boolean;
  ub_warning: string[];
}

// update the formatVerifierOutput function
const formatVerifierOutput = (output: string): ValidationSections => {
  const isSuccess = output.includes('Transformation seems to be correct!');
  
  const sections: ValidationSections = {
    main: [],
    source: [],
    target: [],
    error: [],
    alive2_source: [],
    alive2_target: [],
    example: [],
    success: isSuccess,
    ub_warning: []
  };
  
  const lines = output.split('\n');
  let currentSection: keyof Omit<ValidationSections, 'success'> = 'main';
  let inAlive2Section = false;
  let inUBWarningSection = false;
  
  lines.forEach(line => {
    // check for Alive2 IR sections
    if (line.startsWith('----------------------------------------')) {
      inAlive2Section = true;
      currentSection = 'alive2_source';
      return;
    }
    if (line.startsWith('=>')) {
      currentSection = 'alive2_target';
      return;
    }
    if (line === 'ERROR: Timeout') {
        sections.error.push(line);
        return;
    }
    if (line.startsWith('Transformation')) {
      inAlive2Section = false;
      currentSection = 'main';
      return;
    }
    if (line.startsWith('Example:')) {
      currentSection = 'example';
      return;
    }
    if (line === '****************************************') {
        inUBWarningSection = !inUBWarningSection;
        return;
    }
    if (inUBWarningSection) {
        sections.ub_warning.push(line);
        return;
    }
    // check for counterexample sections
    if (!inAlive2Section) {
      if (line.startsWith('ERROR:')) {
        currentSection = 'error';
      } else if (line.startsWith('Source:')) {
        currentSection = 'source';
        return;
      } else if (line.startsWith('Target:')) {
        currentSection = 'target';
        return;
      } else if (line.startsWith('SOURCE MEMORY STATE')) {
        // seperator for source memory state inside source program state
        sections.source.push('\n');
      } else if (line.startsWith('TARGET MEMORY STATE')) {
        // seperator for target memory state inside target program state
        sections.target.push('\n');
      }
    }
    
    // add line to appropriate section
    sections[currentSection].push(line);
  });
  
  return sections;
};

// add a tooltip portal component
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

// memoize the IR display section
interface IRDisplayProps {
  cppIR: string;
  rustIR: string;
}

const IRDisplay = memo(({ cppIR, rustIR }: IRDisplayProps) => (
  <div className="grid grid-cols-2 gap-6 mb-6">
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-3">C++ LLVM IR</h4>
      <ErrorBoundary>
        <div className="relative h-[400px]">
          {cppIR ? (
            <CodeEditor
              language="llvm"
              value={cppIR}
              onChange={() => {}}
              readOnly={true}
              showCopyButton={true}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <span className="text-gray-500">Generating IR...</span>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-3">Rust LLVM IR</h4>
      <ErrorBoundary>
        <div className="relative h-[400px]">
          {rustIR ? (
            <CodeEditor
              language="llvm"
              value={rustIR}
              onChange={() => {}}
              readOnly={true}
              showCopyButton={true}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <span className="text-gray-500">Generating IR...</span>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  </div>
));

IRDisplay.displayName = 'IRDisplay';

// create a tooltip wrapper component to handle individual tooltips
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

// create a line component to handle individual line rendering
interface LineProps {
  content: string;
}

const Line = memo(({ content }: LineProps) => {
  // handle special cases first
  if (content.includes('ERROR:')) {
    const content_after_splitting = content.split('ERROR: ')[1];
    if (content.includes('type check')) {
        return (
            <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
                <span className="text-rose-600">{content_after_splitting.split('type check')[0]}</span>
                <Tooltip content="whether the type of the two converted LLVM IR functions match with each other">
                    <span className="text-rose-600 font-bold cursor-help border-b border-dotted border-rose-300">
                        type check
                    </span>
                </Tooltip>
                <span className="text-rose-600">{content_after_splitting.split('type check')[1]}</span>
            </div>
        );
    } else if (content.includes('defined')) {
        return (
            <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
                <span className="text-rose-600">{content_after_splitting.split('defined')[0]}</span>
                <Tooltip content="a program state that does not trigger any undefined behavior (UB)">
                    <span className="text-rose-600 font-bold cursor-help border-b border-dotted border-rose-300">
                        defined
                    </span>
                </Tooltip>
                <span className="text-rose-600">{content_after_splitting.split('defined')[1]}</span>
            </div>
        );
    } else if (content.includes('Timeout')) {
        return (
            <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
                <span className="text-rose-600">The verification process </span>
                <Tooltip content="verification process of Alive2 exceeds the time limit">
                    <span className="text-rose-600 font-bold cursor-help border-b border-dotted border-rose-300">
                        timed out
                    </span>
                </Tooltip>
            </div>
        );
    } else {
        return (
            <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
                <span className="text-rose-600">{content_after_splitting}</span>
            </div>
        )
    }
  }

  if (content.match(/^(SOURCE MEMORY STATE|TARGET MEMORY STATE|LOCAL BLOCKS|NON-LOCAL BLOCKS):?$/)) {
    return (
      <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
        <span className="text-blue-600 font-bold">{content}</span>
      </div>
    );
  }

  // handle function-related lines specifically
  if (content.includes('Function @') || content.match(/^@[_A-Za-z]/)) {
    const functionMatch = content.match(/@([_A-Za-z0-9]+)/);
    const functionName = functionMatch?.[1];

    if (functionName) {
      let tooltip = '';

      // determine the type of function and create appropriate tooltip
      if (functionName.startsWith('_ZN')) {
        tooltip = 'Rust mangled function name';
        if (functionName.includes('panic')) {
          tooltip += ' (panic handler)';
        } else if (functionName.includes('core')) {
          tooltip += ' (core library function)';
        }
      } else if (functionName.startsWith('_Z')) {
        tooltip = 'C++ mangled function name';
      } else if (functionName.startsWith('alloc')) {
        tooltip = 'memory allocation function';
      }

      return (
        <div className="block hover:bg-black/5 px-2 -mx-2 text-purple-600 rounded transition-colors">
          <span>Function </span>
          <Tooltip content={tooltip}>
            <span className="text-emerald-600 font-semibold cursor-help border-b border-dotted border-emerald-300">
              @{functionName}
            </span>
          </Tooltip>
          {content.includes('triggered UB') && (
            <>
              <span> </span>
              <Tooltip content="function execution resulted in Undefined Behavior">
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

  // handle jump/branch instructions
  if (content.startsWith('  >>')) {
    const jumpMatch = content.match(/>>\s*Jump to\s*(%\w+)/);
    if (jumpMatch) {
      return (
        <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
          <span className="text-blue-500">{'  >> '}</span>
          <Tooltip content="Branch instruction to a labeled block">
            <span className="cursor-help border-b border-dotted border-gray-400">Jump to</span>
          </Tooltip>
          <span className="text-purple-600">{' ' + jumpMatch[1]}</span>
        </div>
      );
    }
  }

  // split the content into parts using a regex that matches the defined terms
  const parts = content.split(/((?:\b(?:i32|ptr|declare|noreturn|UB|define|call|gep|inbounds|extractvalue|assume|noundef|const|alive|block_id|offset|poison|local|store|load|br|ret|label|align|switch|signext|zext|trunc|sext|alloca|icmp|fcmp|phi|ule|uge|ult|ugt)\b)|(?:%[#_]?[\w.]+)|(?:@[_A-Za-z0-9]+)|(?:#x[0-9a-fA-F]+(?:\([^)]+\))?)|(?:block_id=\d+)|(?:offset=\d+)|(?:Address=#x[0-9a-fA-F]+))/g);

  return (
    <div className="block hover:bg-black/5 px-2 -mx-2 rounded transition-colors">
      {parts.map((part, index) => {
        // handle technical terms
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

        // handle variables
        if (part.startsWith('%')) {
          return <span key={index} className="text-purple-600">{part}</span>;
        }

        // handle block_id and offset
        if (part.startsWith('block_id=') || part.startsWith('offset=')) {
          const [label, value] = part.split('=');
          return (
            <span key={index}>
              {label}=<span className="text-amber-600">{value}</span>
            </span>
          );
        }

        // handle hex values
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

        // handle function names
        if (part.startsWith('@')) {
          const functionName = part.slice(1);
          let tooltip = '';
          
          if (functionName.startsWith('_ZN')) {
            tooltip = 'Rust mangled function name';
            if (functionName.includes('panic')) {
              tooltip += ' (panic handler)';
            } else if (functionName.includes('core')) {
              tooltip += ' (core library function)';
            }
          } else if (functionName.startsWith('_Z')) {
            tooltip = 'C++ mangled function name';
          } else if (functionName.startsWith('alloc')) {
            tooltip = 'memory allocation function';
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

        // return plain text for other parts
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
});

Line.displayName = 'Line';

// update the validation output component
const ValidationOutput = memo(({ sections }: { sections: ValidationSections }) => {
  return (
    <div className="space-y-6">
      {/* Alive2 IR Sections */}
      {sections.alive2_source.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
            <Tooltip content="The original C++ program converted to Alive2 IR form">
              <div className="flex items-center space-x-2 cursor-help">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Source C++ Program</span>
              </div>
            </Tooltip>
          </div>
          <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {sections.alive2_source.map((line, idx) => (
              <Line key={idx} content={line} />
            ))}
          </pre>
        </div>
      )}

      {sections.alive2_target.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
            <Tooltip content="The translated Rust program converted to Alive2 IR form">
              <div className="flex items-center space-x-2 cursor-help">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Translated Rust Program</span>
              </div>
            </Tooltip>
          </div>
          <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {sections.alive2_target.map((line, idx) => (
              <Line key={idx} content={line} />
            ))}
          </pre>
        </div>
      )}

      {/* The Potential Undefined Behavior Warning Sections */}
      {sections.ub_warning.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
            <Tooltip content="Undefined Behavior Detected For The Original C++ Program">
              <div className="flex items-center space-x-2 cursor-help">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Undefined Behavior Detected</span>
              </div>
            </Tooltip>
          </div>
          <pre className="text-yellow-800 font-bold text-sm whitespace-pre-wrap leading-relaxed">
            {sections.ub_warning.map((line, idx) => (
              <Line key={idx} content={line} />
            ))}
          </pre>
        </div>
      )}

      {/* Counterexample Sections (note: only shown when verification fails) */}
      {!sections.success && (
        <>
          {sections.error.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
                <Tooltip content="The counterexample used to justify the failure of the translation">
                  <div className="flex items-center space-x-2 cursor-help">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Error Message</span>
                  </div>
                </Tooltip>
              </div>
              <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {sections.error.map((line, idx) => (
                  <Line key={idx} content={line} />
                ))}
              </pre>
            </div>
          )}

          {sections.example.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
                <Tooltip content="The counterexample used to justify the failure of the translation">
                  <div className="flex items-center space-x-2 cursor-help">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Counterexample</span>
                  </div>
                </Tooltip>
              </div>
              <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {sections.example.map((line, idx) => (
                  <Line key={idx} content={(line === '' && sections.example.length === 1) ? '(None)' : line} />
                ))}
              </pre>
            </div>
          )}

          {sections.source.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
                <Tooltip content="The state of the source program that leads to verification failure">
                  <div className="flex items-center space-x-2 cursor-help">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Source Program State</span>
                  </div>
                </Tooltip>
              </div>
              <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {sections.source.map((line, idx) => (
                  <Line key={idx} content={(line === '' && sections.source.length === 1) ? '(None)' : line} />
                ))}
              </pre>
            </div>
          )}

          {sections.target.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900 font-medium mb-4">
                <Tooltip content="The state of the target program that leads to verification failure">
                  <div className="flex items-center space-x-2 cursor-help">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Target Program State</span>
                  </div>
                </Tooltip>
              </div>
              <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {sections.target.map((line, idx) => (
                  <Line key={idx} content={(line === '' && sections.target.length === 1) ? '(None)' : line} />
                ))}
              </pre>
            </div>
          )}
        </>
      )}
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

  // save scroll position before any state updates
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // restore scroll position after any state updates
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
