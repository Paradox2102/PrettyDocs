import { Component, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  title: string;
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
    this.props.onRetry?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className={styles.box} role="alert">
        <p className={styles.title}>{this.props.title}</p>
        <p className={styles.detail}>{error.message}</p>
        <button type="button" className={styles.retry} onClick={this.retry}>Retry</button>
      </div>
    );
  }
}
