'use client';

import { useState } from 'react';
import CodeEditor from './CodeEditor';
import ExampleSelector from './ExampleSelector';
import { ValidationResult } from '@/types/validator';

export default function CodeEditorForm() {
  const [cppCode, setCppCode] = useState('');
  const [rustCode, setRustCode] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cppCode || !rustCode) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cppCode,
          rustCode,
          functionName: functionName || undefined,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
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
          <label className="block text-lg font-semibold text-gray-800 mb-4">C++ Code</label>
          <CodeEditor
            language="cpp"
            value={cppCode}
            onChange={setCppCode}
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-4">Rust Code</label>
          <CodeEditor
            language="rust"
            value={rustCode}
            onChange={setRustCode}
          />
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          id="functionName"
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 peer"
          placeholder=" "
        />
        <label
          htmlFor="functionName"
          className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
        >
          Function Name (Optional)
        </label>
      </div>

      {/* Result display section */}
      {result && (
        <div className="animate-fade-in mt-8">
          <div className={`rounded-lg p-6 ${
            result.success 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
          }`}>
            <pre className="mt-4 p-4 bg-gray-800 text-gray-100 rounded-lg overflow-auto max-h-96 font-mono text-sm">
              {result.verifier_output}
            </pre>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!cppCode || !rustCode || isLoading}
        className="w-full relative inline-flex items-center justify-center px-8 py-3 overflow-hidden text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Validating...
          </span>
        ) : (
          <span>Validate Translation</span>
        )}
      </button>
    </form>
  );
}
