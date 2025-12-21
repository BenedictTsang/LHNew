import React, { useState, useEffect } from 'react';
import { Bug, X, ChevronRight, CheckCircle, XCircle, AlertCircle, Loader2, Copy, Check, RefreshCw, Settings } from 'lucide-react';
import { DiagnosticCheck, ErrorDetails, formatErrorForCopy } from '../../utils/diagnosticUtils';

interface DiagnosticPanelProps {
  checks: DiagnosticCheck[];
  errorDetails: ErrorDetails | null;
  isRunningChecks: boolean;
  onRunChecks: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'diagnostic_mode_enabled';

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  checks,
  errorDetails,
  isRunningChecks,
  onRunChecks,
  isEnabled,
  onToggleEnabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      onToggleEnabled(saved === 'true');
    }
  }, []);

  const handleToggleEnabled = (enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    onToggleEnabled(enabled);
    if (enabled) {
      onRunChecks();
    }
  };

  const handleCopyError = async () => {
    if (!errorDetails) return;
    const text = formatErrorForCopy(errorDetails);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'failed':
        return <XCircle size={18} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-500" />;
      case 'running':
        return <Loader2 size={18} className="text-blue-500 animate-spin" />;
      default:
        return <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const hasFailures = checks.some(c => c.status === 'failed');
  const hasWarnings = checks.some(c => c.status === 'warning');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 px-3 py-3 rounded-l-lg shadow-lg transition-all hover:pr-4 ${
          errorDetails
            ? 'bg-red-600 text-white'
            : hasFailures
            ? 'bg-red-500 text-white'
            : hasWarnings
            ? 'bg-yellow-500 text-white'
            : isEnabled
            ? 'bg-green-600 text-white'
            : 'bg-gray-700 text-white'
        }`}
        title="Open Diagnostic Panel"
      >
        <Bug size={20} />
        <ChevronRight size={16} className="rotate-180" />
        {isEnabled && (
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        )}
        {errorDetails && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full z-50 flex">
      <div
        className="w-[350px] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Bug size={20} className="text-gray-700" />
            <h2 className="font-semibold text-gray-800">Diagnostics</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Error Detection Mode</span>
              </div>
              <button
                onClick={() => handleToggleEnabled(!isEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {!isEnabled && (
              <p className="text-xs text-gray-500 mt-2">
                Enable to run pre-flight checks and capture detailed errors
              </p>
            )}
          </div>

          {isEnabled && (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Pre-Flight Checks</h3>
                  <button
                    onClick={onRunChecks}
                    disabled={isRunningChecks}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isRunningChecks ? 'animate-spin' : ''} />
                    {isRunningChecks ? 'Running...' : 'Run Checks'}
                  </button>
                </div>

                <div className="space-y-2">
                  {checks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-2 rounded border ${getStatusColor(check.status)}`}
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.status)}
                        <span className="text-sm font-medium text-gray-800">{check.name}</span>
                      </div>
                      {check.message && (
                        <p className="text-xs text-gray-600 mt-1 ml-7">{check.message}</p>
                      )}
                      {check.details && (
                        <p className="text-xs text-gray-500 mt-0.5 ml-7 font-mono">{check.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {errorDetails && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-red-700">Last Error</h3>
                    <button
                      onClick={handleCopyError}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Details</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-semibold text-red-800 uppercase mb-1">What Went Wrong</p>
                      <p className="text-sm text-red-700">{errorDetails.errorMessage}</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Error Code</p>
                      <p className="text-sm font-mono text-gray-800">{errorDetails.errorCode}</p>
                      {errorDetails.errorHint && (
                        <p className="text-xs text-gray-600 mt-1">{errorDetails.errorHint}</p>
                      )}
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs font-semibold text-blue-800 uppercase mb-1">How to Fix</p>
                      <p className="text-sm text-blue-700">{errorDetails.suggestedFix}</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Context</p>
                      <p className="text-xs text-gray-700">{errorDetails.context}</p>
                      <p className="text-xs text-gray-500 mt-1">{errorDetails.timestamp}</p>
                    </div>

                    {errorDetails.payload && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Request Data</p>
                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
                          {JSON.stringify(errorDetails.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!errorDetails && !isRunningChecks && checks.every(c => c.status === 'passed') && (
                <div className="p-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-700">All checks passed</p>
                    <p className="text-xs text-green-600 mt-1">System is ready for assignments</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
