import React from 'react';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-secondary dark:text-white mb-1">
              {this.props.pageName || 'Section'} Error
            </h2>
            <p className="text-black dark:text-white text-sm mb-4">
              {this.state.error?.message || 'Something went wrong in this section.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
