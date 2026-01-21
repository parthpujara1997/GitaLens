import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-parchment p-6">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-stone-warm shadow-lg p-8 text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-charcoal serif">Something went wrong</h2>
                            <p className="text-stone-500 text-sm">
                                An unexpected error occurred. Please try refreshing the page.
                            </p>
                        </div>

                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-saffron-accent text-white font-medium rounded-xl hover:bg-saffron-deep transition-colors"
                        >
                            <RefreshCw size={18} />
                            <span>Try Again</span>
                        </button>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mt-4 p-4 bg-stone-50 rounded-xl text-xs text-stone-600 overflow-auto max-h-40">
                                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                                <pre className="whitespace-pre-wrap">{this.state.error.message}</pre>
                                <pre className="whitespace-pre-wrap mt-2 text-stone-400">{this.state.error.stack}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
