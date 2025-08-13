import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconAlertTriangle className="w-10 h-10 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don't worry, your data is
                safe.
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <IconRefresh className="w-5 h-5" />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                >
                  <IconHome className="w-5 h-5" />
                  Go to Home
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
