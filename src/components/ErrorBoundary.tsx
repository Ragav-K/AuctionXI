import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuctionXI render crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-3">
            <h1 className="text-2xl font-black">Something went wrong.</h1>
            <p className="text-sm text-white/60">
              The auction UI hit an unexpected error. Refresh once or rejoin the room to resync.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
