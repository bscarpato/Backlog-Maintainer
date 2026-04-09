import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
          <div className="max-w-lg rounded-xl bg-white p-6 shadow ring-1 ring-slate-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-xl font-bold text-white">
              !
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Algo deu errado</h1>
            <p className="mt-2 text-sm text-slate-600">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a janela.
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-red-700">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Recarregar
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
