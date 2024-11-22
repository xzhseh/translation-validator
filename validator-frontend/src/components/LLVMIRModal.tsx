import { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor';
import { ValidationResult } from '../types/validator';
import ErrorBoundary from './ErrorBoundary';

interface LLVMIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  cppIR: string;
  rustIR: string;
  validationResult: ValidationResult | null;
  isValidating: boolean;
}

// Add this helper function to format the verifier output
const formatVerifierOutput = (output: string) => {
  const lines = output.split('\n');
  const sections: { [key: string]: string[] } = {
    main: [],
    source: [],
    target: [],
    memory: []
  };
  
  let currentSection = 'main';
  
  lines.forEach(line => {
    if (line.startsWith('Source:')) {
      currentSection = 'source';
    } else if (line.startsWith('Target:')) {
      currentSection = 'target';
    } else if (line.includes('MEMORY STATE')) {
      currentSection = 'memory';
    }
    sections[currentSection].push(line);
  });
  
  return sections;
};

// Add syntax highlighting helper
const highlightLLVMIR = (text: string) => {
  return text.split('\n').map((line, i) => {
    // Basic LLVM IR syntax highlighting
    const highlightedLine = line
      // Keywords
      .replace(/(^|\s)(define|declare|align|alloc|type|ret|br|switch|invoke|resume|unreachable|add|sub|mul|udiv|sdiv|urem|srem|and|or|xor|shl|lshr|ashr|icmp|fcmp|phi|select|call|va_arg|landingpad|catchswitch|catchret|cleanupret|fneg|freeze|load|store|cmpxchg|atomicrmw|getelementptr|trunc|zext|sext|fptrunc|fpext|fptoui|fptosi|uitofp|sitofp|ptrtoint|inttoptr|bitcast|addrspacecast|extractelement|insertelement|shufflevector|extractvalue|insertvalue)(\s|$)/g,
        '$1<span class="text-purple-400">$2</span>$3')
      // Types
      .replace(/(^|\s)(i1|i8|i16|i32|i64|float|double|void|ptr)(\s|$)/g,
        '$1<span class="text-yellow-300">$2</span>$3')
      // Comments
      .replace(/(;.*)$/g,
        '<span class="text-gray-500">$1</span>')
      // Labels
      .replace(/(^[a-zA-Z_][a-zA-Z0-9_]*:)/g,
        '<span class="text-blue-300">$1</span>')
      // Function names
      .replace(/@([a-zA-Z0-9_]+)/g,
        '@<span class="text-green-400">$1</span>');

    return `<span class="block">${highlightedLine}</span>`;
  }).join('\n');
};

export default function LLVMIRModal({
  isOpen,
  onClose,
  cppIR,
  rustIR,
  validationResult,
  isValidating
}: LLVMIRModalProps) {
  const [activeTab, setActiveTab] = useState<'cpp' | 'rust'>('cpp');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Monitor scroll position
  useEffect(() => {
    const resultsDiv = resultsRef.current;
    if (!resultsDiv) return;

    const handleScroll = () => {
      setShowScrollTop(resultsDiv.scrollTop > 200);
    };

    resultsDiv.addEventListener('scroll', handleScroll);
    return () => resultsDiv.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    resultsRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleCopyAll = async () => {
    if (!validationResult) return;
    
    try {
      await navigator.clipboard.writeText(validationResult.verifier_output);
      setCopiedSection('all');
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity duration-300 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl animate-modal-slide-in">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">LLVM IR Generation</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('cpp')}
                className={`${
                  activeTab === 'cpp'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                C++ LLVM IR
              </button>
              <button
                onClick={() => setActiveTab('rust')}
                className={`${
                  activeTab === 'rust'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Rust LLVM IR
              </button>
            </nav>
          </div>

          {/* IR Display with fade transition */}
          <div className="transition-opacity duration-300 ease-in-out">
            <ErrorBoundary>
              <div className="h-[400px] mb-6">
                <CodeEditor
                  language="llvm"
                  value={activeTab === 'cpp' ? cppIR : rustIR}
                  onChange={() => {}}
                  readOnly={true}
                  showCopyButton={true}
                />
              </div>
            </ErrorBoundary>
          </div>

          {/* Validation Result with scroll container */}
          {isValidating ? (
            <div className="flex items-center justify-center py-4 animate-fade-in">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-600">Validating translation...</span>
            </div>
          ) : validationResult && (
            <div 
              ref={resultsRef}
              className={`p-4 rounded-lg max-h-[500px] overflow-y-auto relative animate-fade-in ${
                validationResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {validationResult.success ? (
                    <div className="flex items-center text-green-800">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      <span className="text-lg font-medium">Translation Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-800">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                      </svg>
                      <span className="text-lg font-medium">Verification Failed</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1 text-sm text-gray-600 bg-white hover:bg-gray-50 border rounded-md shadow-sm transition-all duration-200 flex items-center space-x-1"
                >
                  {copiedSection === 'all' ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Output</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-auto">
                {(() => {
                  const sections = formatVerifierOutput(validationResult.verifier_output);
                  return (
                    <div className="space-y-4">
                      {sections.main.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-white font-medium mb-2">Main Output</div>
                          <pre 
                            className="text-white text-sm font-mono whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightLLVMIR(sections.main.join('\n')) 
                            }}
                          />
                        </div>
                      )}
                      
                      {sections.source.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-blue-300 font-medium mb-2">Source Program</div>
                          <pre 
                            className="text-gray-100 text-sm font-mono whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightLLVMIR(sections.source.join('\n')) 
                            }}
                          />
                        </div>
                      )}
                      
                      {sections.target.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-purple-300 font-medium mb-2">Target Program</div>
                          <pre 
                            className="text-gray-100 text-sm font-mono whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightLLVMIR(sections.target.join('\n')) 
                            }}
                          />
                        </div>
                      )}
                      
                      {sections.memory.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-yellow-300 font-medium mb-2">Memory State</div>
                          <pre 
                            className="text-gray-100 text-sm font-mono whitespace-pre-wrap overflow-x-auto"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightLLVMIR(sections.memory.join('\n')) 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Scroll to top button */}
              <button
                onClick={scrollToTop}
                className={`fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg transition-all duration-300 ${
                  showScrollTop 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
                aria-label="Scroll to top"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 