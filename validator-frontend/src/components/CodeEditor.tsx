import Editor from '@monaco-editor/react';
import { useState } from 'react';

interface CodeEditorProps {
  language: 'rust' | 'cpp' | 'llvm';
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  showCopyButton?: boolean;
}

export default function CodeEditor({ 
  language, 
  value, 
  onChange, 
  readOnly,
  showCopyButton = false 
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-[400px] border rounded-lg overflow-hidden">
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 px-3 py-1 text-sm text-gray-600 bg-white/90 hover:bg-white border rounded-md shadow-sm transition-all duration-200 flex items-center space-x-1"
        >
          {copied ? (
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
              <span>Copy</span>
            </>
          )}
        </button>
      )}
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={(value) => onChange(value || '')}
        theme="light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          renderWhitespace: 'selection',
          wordWrap: 'on'
        }}
      />
    </div>
  );
}
