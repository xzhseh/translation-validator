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
            <p className="text-gray-600 text-lg max-w-4xl mx-auto font-fira-sans leading-relaxed">
              Validate semantic equivalence between C++ and Rust LLVM IR using State-Of-The-Art Verification
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
                >Alive2</a> Verifier</span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    );
}
