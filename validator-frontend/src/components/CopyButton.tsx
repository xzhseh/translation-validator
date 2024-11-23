import { memo, useCallback, useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

const CopyButton = memo(({ text, label = "Copy", className = "" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border rounded-lg shadow-sm transition-all duration-200 flex items-center space-x-2 hover:scale-105 ${className}`}
      type="button"
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
          <span>{label}</span>
        </>
      )}
    </button>
  );
});

CopyButton.displayName = 'CopyButton';

export default CopyButton;
