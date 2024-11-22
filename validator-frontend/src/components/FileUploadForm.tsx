'use client';

import { useState } from 'react';
import { ValidationResult } from '@/types/validator';

export default function FileUploadForm() {
  const [cppFile, setCppFile] = useState<File | null>(null);
  const [rustFile, setRustFile] = useState<File | null>(null);
  const [functionName, setFunctionName] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cpp' | 'rust') => {
    const files = e.target.files;
    if (files && files[0]) {
      if (type === 'cpp') setCppFile(files[0]);
      else setRustFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cppFile || !rustFile) return;

    const formData = new FormData();
    formData.append('cppFile', cppFile);
    formData.append('rustFile', rustFile);
    if (functionName) {
      formData.append('functionName', functionName);
    }

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* File Upload Cards */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
          <div className="relative bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-blue-300 transition duration-200">
            <label className="block text-lg font-semibold text-gray-800 mb-4">C++ LLVM IR File</label>
            <div className="relative">
              <input
                type="file"
                accept=".ll"
                onChange={(e) => handleFileChange(e, 'cpp')}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-3 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-600
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              {cppFile && (
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                  </svg>
                  {cppFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Rust File Upload Card - Similar structure */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
          <div className="relative bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-orange-300 transition duration-200">
            <label className="block text-lg font-semibold text-gray-800 mb-4">Rust LLVM IR File</label>
            <div className="relative">
              <input
                type="file"
                accept=".ll"
                onChange={(e) => handleFileChange(e, 'rust')}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-3 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-orange-50 file:text-orange-600
                  hover:file:bg-orange-100
                  cursor-pointer"
              />
              {rustFile && (
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                  </svg>
                  {rustFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  
      {/* Function Name Input with floating label */}
      <div className="relative">
        <input
          type="text"
          id="functionName"
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          placeholder=" "
          className="block px-4 py-3 w-full text-gray-900 bg-transparent border-2 border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        />
        <label
          htmlFor="functionName"
          className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
        >
          Function Name (Optional)
        </label>
      </div>
  
      {/* Validation Results with animation */}
      {result && (
        <div className="animate-fade-in mt-8">
          <div className={`rounded-lg p-6 ${
            result.success 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
          }`}>
            <div className="flex items-center mb-4">
              {result.success ? (
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Validation Successful' : 'Validation Failed'}
              </h3>
            </div>
            {result.error_message && (
              <div className="mb-4 text-red-700 bg-red-50 rounded p-3">
                {result.error_message}
              </div>
            )}
            <pre className="mt-4 p-4 bg-gray-800 text-gray-100 rounded-lg overflow-auto max-h-96 font-mono text-sm">
              {result.verifier_output}
            </pre>
          </div>
        </div>
      )}
  
      {/* Modern submit button with loading state */}
      <button
        type="submit"
        disabled={!cppFile || !rustFile}
        className="w-full relative inline-flex items-center justify-center px-8 py-3 overflow-hidden text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150"
      >
        <span className="relative">Validate Translation</span>
      </button>
    </form>
  );
}
