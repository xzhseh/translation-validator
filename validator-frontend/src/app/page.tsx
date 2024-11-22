import ValidationForm from '@/components/ValidationForm';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Translation Validator
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Validate semantic equivalence between C++ and Rust LLVM IR using state-of-the-art verification
            </p>
          </div>
  
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-100">
            <ErrorBoundary>
              <ValidationForm />
            </ErrorBoundary>
          </div>
  
          <footer className="mt-12 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
              </svg>
              <span>Powered by Alive2 Verifier</span>
            </div>
          </footer>
        </div>
      </main>
    );
}
