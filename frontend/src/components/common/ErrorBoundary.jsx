import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: 32, textAlign: 'center', gap: 16
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="var(--clr-error)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--clr-text)' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}