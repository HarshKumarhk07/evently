import { Component } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/* Catches render-time errors anywhere below it and shows a recovery screen. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          An unexpected error interrupted this page. Reloading usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
        >
          <RotateCw className="h-4 w-4" />
          Reload page
        </button>
      </div>
    );
  }
}
