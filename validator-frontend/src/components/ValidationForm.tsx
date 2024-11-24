'use client';

import CodeEditorForm from './CodeEditorForm';
import ErrorBoundary from './ErrorBoundary';

export default function ValidationForm() {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex items-center px-4 py-2 space-x-2 text-blue-600 bg-blue-50/50 
                      backdrop-blur-sm rounded-full shadow-sm border border-blue-100/50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-sm font-medium font-fira-sans">Code Editor</span>
        </div>
      </div>

      <ErrorBoundary>
        <CodeEditorForm />
      </ErrorBoundary>
    </div>
  );
}
