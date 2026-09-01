import { Component, type ReactNode } from 'react';

import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  public componentDidCatch(): void {
    // StreamElements disables console access in the protected sandbox.
  }

  public render(): ReactNode {
    if (this.state.failed) {
      return <div className={styles.fallback}>Chat overlay failed to render</div>;
    }
    return this.props.children;
  }
}
