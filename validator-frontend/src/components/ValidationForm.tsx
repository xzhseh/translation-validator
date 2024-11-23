'use client';

import { useState } from 'react';
import FileUploadForm from './FileUploadForm';
import CodeEditorForm from './CodeEditorForm';

export default function ValidationForm() {
  const [mode, setMode] = useState<'upload' | 'editor'>('editor');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setMode('editor')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mode === 'editor' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          Code Editor
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mode === 'upload' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          File Upload
        </button>
      </div>

      {mode === 'upload' ? <FileUploadForm /> : <CodeEditorForm />}
    </div>
  );
}
