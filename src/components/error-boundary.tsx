"use client";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary — wraps dashboard pages to catch render errors gracefully.
 * Without this, one failed fetch crashes the entire page to a blank white screen.
 * P2-7 fix: prevents unhandled React render errors from propagating.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "#ef4444",
            background: "#fef2f2",
            borderRadius: "0.5rem",
            margin: "1rem",
          }}>
            <strong>Something went wrong.</strong>
            <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: "#6b7280" }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
