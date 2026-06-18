import React from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle, Terminal, Trash2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details to standard console
    console.error("Aegis AI Runtime Exception Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to clear your local session caches? This will log you out and refresh the portal workspace."
    );
    if (confirmReset) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#02070f] text-slate-200 p-6 font-sans relative overflow-hidden select-none">
          {/* Calming glow grids */}
          <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-[#00f2fe]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-[#0984e3]/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 max-w-xl w-full flex flex-col space-y-6">
            
            {/* Logo header banner */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-2xl animate-pulse shadow-lg shadow-red-500/5">
                <ShieldAlert className="h-8 w-8 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-black tracking-wider text-white">
                AEGIS DIAGNOSTIC RECOVERY
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed font-light max-w-md">
                A rendering runtime exception has occurred in the workspace. The Aegis containment system has successfully isolated the error.
              </p>
            </div>

            {/* Error Diagnostics Info Card */}
            <div className="p-5.5 rounded-2xl bg-[#041424]/40 backdrop-blur-md border border-white/5 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Runtime Exception Isolated</span>
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Error Name:</span>
                <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl text-xs text-red-400 font-mono break-all leading-normal">
                  {this.state.error ? this.state.error.toString() : "Unknown Exception"}
                </div>
              </div>

              {this.state.errorInfo && (
                <details className="group text-left">
                  <summary className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between hover:text-slate-300 transition duration-200">
                    <span className="flex items-center space-x-2">
                      <Terminal className="h-3.5 w-3.5 text-slate-500" />
                      <span>Inspect Stack Details</span>
                    </span>
                    <span className="text-[9px] bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-slate-400 font-normal">
                      Click to Expand
                    </span>
                  </summary>
                  <div className="mt-3 p-3 bg-slate-950/60 border border-white/5 rounded-xl text-[10px] text-slate-500 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">
                    {this.state.errorInfo.componentStack}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons Panel */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3.5 bg-gradient-to-r from-medical-blue to-[#00f2fe] text-[#030d16] font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,242,254,0.2)] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 stroke-[2.5]" />
                <span>Reload Portal Workspace</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="py-3.5 px-6 bg-white/5 border border-white/10 hover:border-white/15 text-slate-300 hover:text-white rounded-xl transition-all duration-300 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
                title="Clears JWT Token and cache"
              >
                <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-white" />
                <span>Reset Session Cache</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-light text-center tracking-wide flex items-center justify-center space-x-1.5">
              <span>If issues persist, please inspect your console logs or reach out to security personnel.</span>
            </p>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
