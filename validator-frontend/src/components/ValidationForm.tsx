'use client';

import { useState } from 'react';
import FileUploadForm from './FileUploadForm';
import CodeEditorForm from './CodeEditorForm';

export default function ValidationForm() {
  const [mode, setMode] = useState<'editor' | 'upload'>('editor');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center p-1 bg-gray-100 rounded-lg space-x-1 mb-8 max-w-xs mx-auto">
        <button
          onClick={() => setMode('editor')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'editor' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Code Editor</span>
          </div>
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'upload' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>File Upload</span>
          </div>
        </button>
      </div>

      {mode === 'upload' ? <FileUploadForm /> : <CodeEditorForm />}
    </div>
  );
}
