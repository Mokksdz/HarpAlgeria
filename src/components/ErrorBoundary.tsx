"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });
        
        // Log to external service in production
        if (process.env.NODE_ENV === "production") {
            // Example: Sentry.captureException(error);
            console.error("Error caught by boundary:", error, errorInfo);
        }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} className="text-red-600" />
                        </div>
                        
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                            Oups ! Une erreur s&apos;est produite
                        </h2>
                        
                        <p className="text-gray-600 mb-6">
                            Nous sommes désolés, quelque chose ne s&apos;est pas passé comme prévu.
                            Veuillez réessayer ou retourner à l&apos;accueil.
                        </p>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                                <p className="text-sm font-mono text-red-800 break-all">
                                    {this.state.error.message}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-red-600 cursor-pointer">
                                            Stack trace
                                        </summary>
                                        <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-harp-brown text-white rounded-lg font-medium hover:bg-harp-caramel transition-colors"
                            >
                                <RefreshCw size={18} />
                                Réessayer
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-harp-brown text-harp-brown rounded-lg font-medium hover:bg-harp-brown hover:text-white transition-colors"
                            >
                                <Home size={18} />
                                Accueil
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
    const [, setError] = React.useState<Error | null>(null);

    return React.useCallback((error: Error) => {
        setError(() => {
            throw error;
        });
    }, []);
}

// Simple wrapper component for easier use
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
