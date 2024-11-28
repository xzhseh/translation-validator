'use client';

import { useState } from 'react';
import CodeEditor from './CodeEditor';
import ExampleSelector from './ExampleSelector';
import { ValidationResult } from '@/types/validator';
import LLVMIRModal from './LLVMIRModal';
import Toast from './Toast';

interface ToastMessage {
  type: 'error' | 'success' | 'info';
  message: string;
}

export default function CodeEditorForm() {
  const [cppCode, setCppCode] = useState('');
  const [rustCode, setRustCode] = useState('');
  const [functionName, setFunctionName] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cppCode || !rustCode) return;

    setIsGeneratingIR(true);
    setResult(null);
    
    try {
      // Show IR generation loading state
      showToast('Generating LLVM IR...', 'info');
      
      const irResponse = await fetch('/api/generate-ir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cppCode, rustCode }),
      });
      
      if (!irResponse.ok) {
        throw new Error('Failed to generate IR');
      }
      
      const irData = await irResponse.json();
      if (irData.error) {
        throw new Error(irData.error);
      }

      // Store the generated IR
      setCppIR(irData.cppIR);
      setRustIR(irData.rustIR);
      setShowIRModal(true);

      // Start validation
      setIsLoading(true);
      showToast('IR generated, starting validation...', 'info');

      // Then validate the translation
      const validationResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cppIR: irData.cppIR,
          rustIR: irData.rustIR,
          functionName: functionName || undefined,
        }),
      });

      if (!validationResponse.ok) {
        throw new Error('Validation failed');
      }

      const validationData: ValidationResult = await validationResponse.json();
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
          <label className="block text-lg font-semibold text-gray-800 mb-4">Source C++ Code</label>
          <CodeEditor
            language="cpp"
            value={cppCode}
            onChange={setCppCode}
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-4">Translated Rust Code</label>
          <CodeEditor
            language="rust"
            value={rustCode}
            onChange={setRustCode}
          />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <input
          type="text"
          id="functionName"
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                   shadow-sm transition-colors duration-200
                   hover:border-gray-300"
          placeholder="Function Name (Optional)"
        />
      </div>

      <LLVMIRModal
        isOpen={showIRModal}
        onClose={() => setShowIRModal(false)}
        cppIR={cppIR}
        rustIR={rustIR}
        validationResult={result}
        isValidating={isLoading}
      />

      <button
        type="submit"
        disabled={!cppCode || !rustCode || isLoading || isGeneratingIR}
        className={`w-full relative inline-flex items-center justify-center px-8 py-3 
                 overflow-hidden text-white bg-gradient-to-r from-blue-600 to-purple-600 
                 rounded-lg group focus:outline-none focus:ring-2 focus:ring-offset-2 
                 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed 
                 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150`}
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
