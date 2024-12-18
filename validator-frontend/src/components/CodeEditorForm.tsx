'use client';

import { useState } from 'react';
import CodeEditor from './CodeEditor';
import ExampleSelector from './ExampleSelector';
import { ValidationResult } from '@/types/validator';
import LLVMIRModal from './LLVMIRModal';
import Toast from './Toast';
import Image from 'next/image';

interface ToastMessage {
  type: 'error' | 'success' | 'info';
  message: string;
}

export default function CodeEditorForm() {
  const [cppCode, setCppCode] = useState('');
  const [rustCode, setRustCode] = useState('');
  const [cppFunctionName, setCppFunctionName] = useState('');
  const [rustFunctionName, setRustFunctionName] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIRModal, setShowIRModal] = useState(false);
  const [cppIR, setCppIR] = useState('');
  const [rustIR, setRustIR] = useState('');
  const [isGeneratingIR, setIsGeneratingIR] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info') => {
    setToast({ message, type });
  };

  const CODE_LENGTH_LIMIT = 10000;
  const LLVM_IR_LENGTH_LIMIT = 50000;
  const checkLimit = (codeName: string, code: string, typeName: string, limit: number) => {
    if (code.length > limit) {
      throw new Error(`${codeName} length limit exceeded.
                      Please keep the ${typeName} under ${limit} characters.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cppCode || !rustCode) {
      return;
    }

    setIsGeneratingIR(true);
    setResult(null);

    try {
      // the IR generation loading state
      showToast('Generating LLVM IR...', 'info');

      // code length check
      checkLimit('C++ code', cppCode, 'C++ code', CODE_LENGTH_LIMIT);
      checkLimit('Rust code', rustCode, 'Rust code', CODE_LENGTH_LIMIT);

      const irResponse = await fetch('/api/generate-ir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cppCode, rustCode }),
      });

      const irData = await irResponse.json();

      // check for potential error for /api/generate-ir
      if (!irResponse.ok || irData.error) {
        throw new Error(irData.error);
      }

      // store the generated IR
      setCppIR(irData.cppIR);
      setRustIR(irData.rustIR);
      setShowIRModal(true);

      // start the validation
      setIsLoading(true);
      showToast('LLVM IR generated, starting validation...', 'info');

      // llvm ir length check
      checkLimit('C++ IR', irData.cppIR, 'generated C++ IR', LLVM_IR_LENGTH_LIMIT);
      checkLimit('Rust IR', irData.rustIR, 'generated Rust IR', LLVM_IR_LENGTH_LIMIT);

      // validate the translation
      const validationResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cppIR: irData.cppIR,
          rustIR: irData.rustIR,
          cppFunctionName: cppFunctionName.length > 0 ? cppFunctionName : 'EMPTY',
          rustFunctionName: rustFunctionName.length > 0 ? rustFunctionName : 'EMPTY',
        }),
      });

      const validationData = await validationResponse.json();

      // check for potential error for /api/validate
      if (!validationResponse.ok || validationData.error) {
        throw new Error(validationData.error);
      }

      setResult(validationData);
      if (validationData.success) {
        showToast('Validation completed successfully!', 'success');
      } else {
        showToast('Validation failed. Check the results for details.', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showToast(errorMessage, 'error');
      setResult({
        success: false,
        verifier_output: errorMessage,
        num_errors: 1
      });
    } finally {
      setIsGeneratingIR(false);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ExampleSelector 
        onSelect={(cpp, rust) => {
          setCppCode(cpp);
          setRustCode(rust);
        }} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-50/80 backdrop-blur-sm 
                            shadow-sm hover:shadow-md transition-all duration-300 
                            border border-blue-100/50 group">
              <Image 
                src="/icons/cpp_icon.svg" 
                alt="C++" 
                width={24}
                height={24}
                className="group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-base font-medium text-blue-600">Source C++ Code</span>
            </div>
          </div>
          <CodeEditor
            language="cpp"
            value={cppCode}
            onChange={setCppCode}
          />
        </div>

        <div>
          <div className="flex items-center mb-6 justify-between">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-orange-50/80 backdrop-blur-sm 
                            shadow-sm hover:shadow-md transition-all duration-300 
                            border border-orange-100/50 group">
              <Image 
                src="/icons/rust_icon.svg" 
                alt="Rust" 
                width={24}
                height={24}
                className="group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-base font-medium text-orange-600">Translated Rust Code</span>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setCppCode('');
                setRustCode('');
                setCppIR('');
                setRustIR('');
                setResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-50/80 
                        rounded-lg hover:bg-gray-100/80 focus:outline-none focus:ring-2 
                        focus:ring-offset-2 focus:ring-gray-500 transition-all duration-150 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        border border-gray-200/50"
              disabled={!cppCode && !rustCode && !cppIR && !rustIR}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          </div>
          <CodeEditor
            language="rust"
            value={rustCode}
            onChange={setRustCode}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10 pointer-events-auto">
            <div className="flex items-center gap-2 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110">
                <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            value={cppFunctionName}
            onChange={(e) => setCppFunctionName(e.target.value)}
            className="peer block w-full pl-10 pr-4 py-3 
                     bg-gradient-to-r from-blue-50/90 to-blue-100/50
                     border border-blue-100/50 
                     rounded-xl
                     shadow-sm 
                     transition-all duration-300
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     hover:border-blue-200 hover:shadow-md hover:scale-[1.01]
                     group-hover:shadow-md"
            placeholder="C++ Function Name (Optional)"
          />
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10 pointer-events-auto">
            <div className="flex items-center gap-2 text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110">
                <path d="M5.507 4.048A3 3 0 017.785 3h8.43a3 3 0 012.278 1.048l1.722 2.008A4.533 4.533 0 0019.5 6h-15c-.243 0-.482.02-.715.056l1.722-2.008z" />
                <path fillRule="evenodd" d="M1.5 10.5a3 3 0 013-3h15a3 3 0 110 6h-15a3 3 0 01-3-3zm15 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm2.25.75a.75.75 0 100-1.5.75.75 0 000 1.5zM4.5 15a3 3 0 100 6h15a3 3 0 100-6h-15zm11.25 3.75a.75.75 0 100-1.5.75.75 0 000 1.5zM19.5 18a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            value={rustFunctionName}
            onChange={(e) => setRustFunctionName(e.target.value)}
            className="peer block w-full pl-10 pr-4 py-3
                     bg-gradient-to-r from-orange-50/90 to-orange-100/50
                     border border-orange-100/50
                     rounded-xl
                     shadow-sm
                     transition-all duration-300
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     hover:border-orange-200 hover:shadow-md hover:scale-[1.01]
                     group-hover:shadow-md"
            placeholder="Rust Function Name (Optional)"
          />
        </div>
      </div>

      <LLVMIRModal
        isOpen={showIRModal}
        onClose={() => setShowIRModal(false)}
        cppIR={cppIR}
        rustIR={rustIR}
        validationResult={result}
        isValidating={isLoading}
      />

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!cppCode || !rustCode || isLoading || isGeneratingIR}
          className={`w-full relative inline-flex items-center justify-center px-8 py-3 
                   overflow-hidden text-white bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
                   rounded-lg group focus:outline-none focus:ring-2 focus:ring-offset-2 
                   focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed 
                   transform hover:-translate-y-0.5 transition-all duration-150
                   animate-button-flow`}
        >
          {isGeneratingIR ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating LLVM IR...</span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Validating Translation...</span>
            </div>
          ) : (
            <span>Validate Translation</span>
          )}
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  );
}
