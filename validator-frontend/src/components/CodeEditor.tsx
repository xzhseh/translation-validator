import Editor, { Monaco } from '@monaco-editor/react';
import { memo, useCallback, useEffect } from 'react';
import CopyButton from './CopyButton';
import { editor } from 'monaco-editor';

// Import the technical terms from LLVMIRModal
import { technicalTerms } from './LLVMIRModal';

interface CodeEditorProps {
  language: 'rust' | 'cpp' | 'llvm';
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  showCopyButton?: boolean;
}

const CodeEditor = memo(({ 
  language, 
  value, 
  onChange, 
  readOnly,
  showCopyButton = false 
}: CodeEditorProps) => {
  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '');
  }, [onChange]);

  // Setup Monaco editor with LLVM IR syntax highlighting and tooltips
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    if (language === 'llvm') {
      // Only register the language once
      if (!monaco.languages.getLanguages().some(lang => lang.id === 'llvm')) {
        // Register a new language
        monaco.languages.register({ id: 'llvm' });

        // Define syntax highlighting rules
        monaco.languages.setMonarchTokensProvider('llvm', {
          tokenizer: {
            root: [
              // Comments
              [/;.*$/, 'comment'],
              
              // Keywords
              [/\b(define|declare|align|alloc|type|ret|br|switch|invoke|resume|unreachable|add|sub|mul|div|rem|and|or|xor|shl|lshr|ashr|icmp|fcmp|phi|select|call|load|store)\b/, 'keyword'],
              
              // Types
              [/\b(i1|i8|i16|i32|i64|float|double|void|ptr)\b/, 'type'],
              
              // Variables
              [/%[a-zA-Z0-9_#]+/, 'variable'],
              
              // Function names
              [/@[a-zA-Z0-9_]+/, 'function'],
              
              // Numbers and hex values
              [/#x[0-9a-fA-F]+/, 'number.hex'],
              [/\b\d+\b/, 'number'],
              
              // Technical terms
              [/\b(noundef|poison|UB)\b/, 'keyword.control'],
            ]
          }
        });

        // Add hover provider for tooltips
        monaco.languages.registerHoverProvider('llvm', {
          provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const term = word.word;
            const tooltip = technicalTerms[term];
            
            if (tooltip) {
              return {
                contents: [
                  { value: `**${term}**` },
                  { value: tooltip }
                ]
              };
            }

            // Add special cases for common patterns
            if (term.startsWith('_ZN')) {
              return {
                contents: [{ value: 'Rust mangled function name' }]
              };
            }
            if (term.startsWith('_Z')) {
              return {
                contents: [{ value: 'C++ mangled function name' }]
              };
            }

            return null;
          }
        });

        // Add custom theme rules
        monaco.editor.defineTheme('llvm-theme', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'keyword', foreground: '5B21B6' },
            { token: 'type', foreground: 'D97706' },
            { token: 'variable', foreground: '7C3AED' },
            { token: 'function', foreground: '059669' },
            { token: 'number.hex', foreground: 'EA580C' },
            { token: 'number', foreground: 'D97706' },
            { token: 'keyword.control', foreground: '2563EB' },
            { token: 'comment', foreground: '6B7280' },
          ],
          colors: {}
        });
      }

      // Set the theme
      monaco.editor.setTheme('llvm-theme');
    }
  }, [language]);

  return (
    <div className="relative h-[400px] border rounded-lg overflow-hidden">
      {showCopyButton && (
        <div className="absolute top-2 right-2 z-10">
          <CopyButton text={value} className="!px-3 !py-1 text-sm bg-white/90" />
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={handleChange}
        theme="light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          renderWhitespace: 'selection',
          wordWrap: 'on',
          suggest: { showWords: false },
          fontFamily: 'Fira Code',
          fontLigatures: true,
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
