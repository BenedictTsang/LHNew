import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Pin, X } from 'lucide-react';

interface SourceInfo {
  component: string;
  file: string;
  x: number;
  y: number;
}

const SourceInspector: React.FC = () => {
  const [isDetectionMode, setIsDetectionMode] = useState(() => {
    const saved = localStorage.getItem('detectionMode');
    return saved === 'true';
  });
  const [hoveredSource, setHoveredSource] = useState<SourceInfo | null>(null);
  const [pinnedSource, setPinnedSource] = useState<SourceInfo | null>(null);

  const toggleDetectionMode = () => {
    const newValue = !isDetectionMode;
    setIsDetectionMode(newValue);
    localStorage.setItem('detectionMode', String(newValue));
  };

  useEffect(() => {
    if (!isDetectionMode) {
      setHoveredSource(null);
      setPinnedSource(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (pinnedSource) return; // Don't update hover when pinned

      const target = e.target as HTMLElement;
      const sourceElement = target.closest('[data-source-tsx]') as HTMLElement;
      
      if (sourceElement) {
        const sourceData = sourceElement.getAttribute('data-source-tsx');
        if (sourceData) {
          const [component, file] = sourceData.split('|');
          setHoveredSource({
            component: component || 'Unknown Component',
            file: file || 'Unknown File',
            x: e.clientX,
            y: e.clientY,
          });
        }
      } else {
        setHoveredSource(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!hoveredSource) return;

      e.preventDefault();
      e.stopPropagation();
      
      setPinnedSource({
        ...hoveredSource,
        x: e.clientX,
        y: e.clientY,
      });
      setHoveredSource(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isDetectionMode, hoveredSource, pinnedSource]);

  const currentSource = pinnedSource || hoveredSource;

  return (
    <>
      {/* Detection Mode Toggle */}
      <button
        onClick={toggleDetectionMode}
        className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all shadow-lg ${
          isDetectionMode
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'bg-gray-700 text-white hover:bg-gray-600 opacity-70 hover:opacity-100'
        }`}
        style={{ fontFamily: 'Times New Roman, serif' }}
        title={isDetectionMode ? 'Exit Detection Mode' : 'Enter Detection Mode'}
      >
        {isDetectionMode ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>

      {/* Source Info Floating Window */}
      {currentSource && (
        <div
          className="fixed z-[9998] bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-xl max-w-sm pointer-events-none"
          style={{
            left: Math.min(currentSource.x + 10, window.innerWidth - 300),
            top: Math.max(currentSource.y - 80, 10),
            fontFamily: 'Times New Roman, serif',
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-sm text-orange-400">Component Source</h3>
            {pinnedSource && (
              <button
                onClick={() => setPinnedSource(null)}
                className="text-gray-400 hover:text-white pointer-events-auto"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-400">Component:</span>
              <span className="ml-2 text-blue-300">{currentSource.component}</span>
            </div>
            <div>
              <span className="text-gray-400">File:</span>
              <span className="ml-2 text-green-300">{currentSource.file}</span>
            </div>
          </div>

          {pinnedSource && (
            <div className="flex items-center mt-2 text-xs text-gray-400">
              <Pin size={12} className="mr-1" />
              <span>Pinned - Click X to unpin</span>
            </div>
          )}
        </div>
      )}

      {/* Detection Mode Overlay */}
      {isDetectionMode && (
        <div className="fixed inset-0 z-[9997] pointer-events-none">
          <div className="absolute top-20 left-4 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
            <div className="font-bold mb-1">Detection Mode Active</div>
            <div className="text-xs">
              • Hover over components to see source info<br/>
              • Click to pin the info window
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SourceInspector;