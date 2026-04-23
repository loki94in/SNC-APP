import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 max-w-md animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">System Interruption</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              The application encountered an unexpected issue. Your clinical data remains safe in the database.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
              >
                Restart Application
              </button>
              <button 
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Try to Recover
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
