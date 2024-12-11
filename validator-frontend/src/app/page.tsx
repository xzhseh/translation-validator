import ValidationForm from '@/components/ValidationForm';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold text-center animate-text-flow">
              Translation Validator
            </h1>
            <div className="flex justify-center space-x-8 mb-6">
                <a
                href="https://github.com/xzhseh/translation_validator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center space-x-2"
                >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
                </a>
                <a
                href="https://translation-validator.com/slides"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center space-x-2"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-medium">Slides</span>
                </a>
            </div>
            <p className="text-gray-600 text-lg max-w-4xl mx-auto font-fira-sans leading-relaxed">
              Validate semantic equivalence between <b><span className="text-blue-600"><span className="underline">C++</span></span></b> and <b><span className="text-orange-600"><span className="underline">Rust</span></span></b> LLVM IR using <b>State-Of-The-Art</b> Verification
            </p>
          </div>
  
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-100">
            <ErrorBoundary>
              <ValidationForm />
            </ErrorBoundary>
          </div>
  
          <footer className="mt-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-gray-600 font-fira-sans">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Powered by <a 
                  href="https://github.com/AliveToolkit/alive2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                ><span className="underline"><b>Alive2</b></span></a></span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    );
}
