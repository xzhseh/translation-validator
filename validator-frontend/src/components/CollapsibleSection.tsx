import { useState, useCallback, useRef, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function CollapsibleSection({ 
  title, 
  titleColor = 'text-blue-300',
  children,
  defaultExpanded = true
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [children]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className={`font-medium ${titleColor} flex items-center`}>
          <svg
            className={`w-4 h-4 mr-2 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          {title}
        </div>
      </button>
      <div
        style={{
          height: isExpanded ? contentHeight ? `${contentHeight}px` : 'auto' : '0px'
        }}
        className="transition-all duration-200 ease-in-out overflow-hidden"
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
}
