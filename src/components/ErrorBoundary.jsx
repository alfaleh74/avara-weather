/**
 * Error boundary component to catch and handle errors gracefully
 */

'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-zinc-900">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-8 max-w-2xl m-4">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-red-500">Something went wrong</h2>
            </div>
            
            <p className="text-red-400 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 bg-zinc-950 p-4 rounded border border-zinc-700">
                <summary className="cursor-pointer text-zinc-400 font-semibold mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

