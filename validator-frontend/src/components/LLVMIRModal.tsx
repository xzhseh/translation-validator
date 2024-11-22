import { useState } from 'react';
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

export default function LLVMIRModal({
  isOpen,
  onClose,
  cppIR,
  rustIR,
  validationResult,
  isValidating
}: LLVMIRModalProps) {
  const [activeTab, setActiveTab] = useState<'cpp' | 'rust'>('cpp');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
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

          {/* IR Display */}
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

          {/* Validation Result */}
          {isValidating ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-600">Validating translation...</span>
            </div>
          ) : validationResult && (
            <div className={`p-4 rounded-lg ${
              validationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {validationResult.success ? (
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`font-medium ${validationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.success ? 'Translation Verified' : 'Verification Failed'}
                </span>
              </div>
              <pre className="mt-2 p-3 bg-black text-white rounded-lg overflow-auto text-sm">
                {validationResult.verifier_output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 