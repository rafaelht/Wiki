import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI or use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-96 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error en el componente
            </h2>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || 'Ha ocurrido un error inesperado'}
            </p>
            
            {(import.meta as any).env.DEV && (
              <details className="text-left bg-red-100 p-3 rounded text-sm mb-4">
                <summary className="cursor-pointer font-medium text-red-800">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 text-red-700 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
