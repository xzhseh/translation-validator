import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  language: 'rust' | 'cpp';
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  return (
    <div className="h-[400px] border rounded-lg overflow-hidden">
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
        }}
      />
    </div>
  );
}
