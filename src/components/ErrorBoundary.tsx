import { Component, type ReactNode, type ErrorInfo } from 'react';
interface Props { children: ReactNode }
interface State { error: Error | null }
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo): void { console.error('LabStudio ErrorBoundary:', error, info); }
  render(): ReactNode {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 24 }}>
          <div style={{ maxWidth: 560, border: '1px solid #7f1d1d', borderRadius: 8, padding: 24, background: '#0a0a0a' }}>
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>Error de renderizado</div>
            <div style={{ fontSize: 13, color: '#a3a3a3', marginBottom: 12 }}>{this.state.error.message}</div>
            <button onClick={() => location.reload()} style={{ background: '#3B82F6', color: '#fff', border: 0, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>Recargar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
