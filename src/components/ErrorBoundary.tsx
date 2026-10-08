import { Component, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

/**
 * True for a code chunk that did not download (a lazy page or the 3D code). React keeps a failed lazy import, so
 * only a page reload can recover it. The messages are Chrome's, Firefox's, Safari's and Vite's preload helper's.
 */
export function isChunkLoadError(error: Error): boolean {
  return /dynamically imported module|Importing a module script failed|Unable to preload/i.test(error.message);
}

interface Props {
  title: string;
  /** How to reload the page after a failed code chunk; tests pass a stub. */
  reload?: () => void;
  /** Shown in place of the message box, for a part of a page that can fail quietly (the overview hero). */
  fallback?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Shows `title`, the error text and a Retry button when a child throws (for example a failed content load). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  retry = () => {
    if (this.state.error && isChunkLoadError(this.state.error)) {
      (this.props.reload ?? (() => window.location.reload()))();
      return;
    }
    this.props.onRetry?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className={styles.box} role="alert">
        <p className={styles.title}>{isChunkLoadError(error) ? "This page's code did not load" : this.props.title}</p>
        <p className={styles.detail}>{error.message}</p>
        <button type="button" className={styles.retry} onClick={this.retry}>Retry</button>
      </div>
    );
  }
}
