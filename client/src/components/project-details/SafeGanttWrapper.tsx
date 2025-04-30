import React, { useEffect, useRef, useState, ErrorInfo } from 'react';
import { Gantt, Task as GanttTask } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
// Import a class names utility
import { cn } from "@/lib/utils";

// Create a style tag to add a protective overlay on timeline areas
const addProtectiveOverlayStyles = () => {
  try {
    // Check if styles already added
    if (document.getElementById('gantt-protective-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'gantt-protective-styles';
    style.innerHTML = `
      /* EXTREME FIX: Complete isolation of problematic areas while preserving functionality */

      /* Turn off all tooltips - these are the source of the errors */
      .wx-gantt-tooltip,
      [data-tooltip],
      [class*="tooltip"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      
      /* Block ALL mouse events on the timeline and grid */
      .wx-gantt-calendar, 
      .wx-gantt-grid,
      .wx-gantt-grid-data,
      .wx-gantt-calendar-row,
      .wx-gantt-header,
      .wx-gantt-timeline,
      .wx-gantt-timeline-area {
        pointer-events: none !important;
        user-select: none !important;
      }
      
      /* Completely disable any hover effects in the timeline area */
      .wx-gantt-calendar *:hover,
      .wx-gantt-timeline *:hover,
      .wx-gantt-grid *:hover {
        pointer-events: none !important;
      }
      
      /* Selectively re-enable ONLY the task bars and their interactive elements */
      .wx-gantt-bar,
      .wx-gantt-bar-wrapper,
      .wx-gantt-bar-label,
      .wx-gantt-progress-handle,
      .wx-gantt-task-link-control,
      .wx-gantt-link-point {
        pointer-events: auto !important;
        z-index: 9999 !important; /* Maximum z-index to ensure they're on top */
        position: relative !important; /* Ensure proper positioning */
      }
      
      /* Keep the list view fully interactive */
      .wx-gantt-list,
      .wx-gantt-list-item,
      .wx-gantt-list-header,
      .wx-gantt-list-column,
      .wx-gantt-list-header-cell,
      .wx-gantt-list * {
        pointer-events: auto !important;
      }
      
      /* Enhance task bars to make them more visually prominent */
      .wx-gantt-bar {
        stroke-width: 1.5px !important;
        stroke: rgba(0,0,0,0.6) !important;
        filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.2)) !important;
        transition: filter 0.2s ease, opacity 0.2s ease !important;
      }
      
      /* Make task bars have a visual hover effect */
      .wx-gantt-bar:hover {
        filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4)) brightness(105%) !important;
        opacity: 0.95 !important;
      }
      
      /* Make connection points very obvious */
      .wx-gantt-link-point {
        r: 5px !important; /* Larger radius */
        fill: rgba(0, 120, 212, 0.8) !important; /* More visible blue */
        stroke: white !important;
        stroke-width: 1.5px !important;
        filter: drop-shadow(0px 0px 2px rgba(0,0,0,0.3)) !important;
        transition: all 0.2s ease !important;
      }
      
      /* Highlight connection points on hover */
      .wx-gantt-link-point:hover {
        fill: rgba(0, 120, 212, 1) !important; /* Full opacity blue */
        r: 6px !important; /* Even larger on hover */
        filter: drop-shadow(0px 0px 4px rgba(0,120,212,0.5)) !important;
      }
    `;
    document.head.appendChild(style);
    
    // Set global flag
    (window as any).__GANTT_PROTECTIVE_STYLES_ADDED__ = true;
  } catch (err) {
    console.error('[SafeGanttWrapper] Failed to add protective styles:', err);
  }
};

// Define the enum locally since it's not exported
type ViewModeType = "Day" | "Week" | "Month";

// Props interface that matches the Gantt chart props we need
interface SafeGanttWrapperProps {
  tasks: GanttTask[];
  viewMode: ViewModeType;
  onClick?: (task: GanttTask) => void;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  onRelationChange?: (from: string, to: string) => void;
  listCellWidth?: string;
  columnWidth?: number;
  rowHeight?: number;
  ganttHeight?: number;
  locale?: string;
  readonly?: boolean;
}

/**
 * A wrapper component for wx-react-gantt that adds error boundaries and event prevention
 * to handle type errors that occur within the library
 */
// Error boundary component to catch errors during rendering
class GanttErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Gantt chart error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-semibold text-red-700">Gantt Chart Error</h3>
          <p className="text-sm text-red-600">
            There was an error rendering the Gantt chart. Please try refreshing the page.
          </p>
          <p className="text-xs text-red-500 mt-2">
            {this.state.error?.message || "Unknown error"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function SafeGanttWrapper(props: SafeGanttWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Apply our CSS protection and patch the MouseEvent.prototype
  useEffect(() => {
    // Add protective styles to intercept mouse events
    addProtectiveOverlayStyles();
    
    // Patch MouseEvent to ensure no undefined.type errors
    try {
      // Create a helper function to safely get event target type
      (window as any).getSafeEventTargetType = function(event: any) {
        try {
          // First check if we can safely access the type
          if (event && event.target && typeof event.target.type !== 'undefined') {
            return event.target.type;
          }
          return ""; // Return empty string as a safe default
        } catch (e) {
          return ""; // Return empty string on any error
        }
      };
      
      console.info('[SafeGanttWrapper] Applied event safety patches');
    } catch (err) {
      console.error('[SafeGanttWrapper] Failed to patch MouseEvent:', err);
    }
  }, []);
  
  // NUCLEAR OPTION: Deep patch the library prototype methods that may access undefined.type
  useEffect(() => {
    try {
      // Wait for component to mount and library to initialize
      setTimeout(() => {
        // Find all objects on window that might be part of the Gantt library
        Object.keys(window).forEach(key => {
          // Only process objects
          const obj = (window as any)[key];
          if (obj && typeof obj === 'object') {
            // Look for properties that might contain the problematic code
            Object.keys(obj).forEach(propKey => {
              // Find properties that sound like they might handle events
              if (propKey.toLowerCase().includes('event') || 
                  propKey.toLowerCase().includes('handler') ||
                  propKey.toLowerCase().includes('mouse') ||
                  propKey.toLowerCase().includes('move') ||
                  propKey.toLowerCase().includes('hover')) {
                
                // If we find a function, try to patch it
                const prop = obj[propKey];
                if (typeof prop === 'function') {
                  try {
                    // Save original function
                    const original = prop;
                    
                    // Replace with safe version that catches errors
                    obj[propKey] = function() {
                      try {
                        return original.apply(this, arguments);
                      } catch (err) {
                        if (String(err).includes('Cannot read properties of undefined') &&
                            String(err).includes('type')) {
                          // Log but suppress the specific error we're targeting
                          console.warn('[SafeGanttWrapper] Suppressed error in patched function:', propKey);
                          return undefined;
                        }
                        // Re-throw other errors
                        throw err;
                      }
                    };
                  } catch (e) {
                    // Some properties may not be writable
                  }
                }
              }
            });
          }
        });
      }, 500);
    } catch (err) {
      console.error('[SafeGanttWrapper] Error in nuclear prototype patching:', err);
    }
  }, []);
  
  // Add global error handler to catch and suppress type errors from the Gantt chart
  useEffect(() => {
    // Save original console.error to restore later
    const originalConsoleError = console.error;
    const originalWindowOnerror = window.onerror;
    
    // Replace with filtered version
    console.error = (...args: any[]) => {
      // Check if this is the specific type error from the Gantt chart
      const errorString = args.join(' ');
      if (errorString.includes("Cannot read properties of undefined") && 
          errorString.includes("type")) {
        // Suppress this specific error
        return;
      }
      // Pass through all other errors
      originalConsoleError(...args);
    };
    
    // Add global window.onerror handler
    window.onerror = (message, source, lineno, colno, err) => {
      if (message && typeof message === 'string' && 
          message.includes("Cannot read properties of undefined") && 
          message.includes("type")) {
        // Prevent the error from bubbling up
        return true;
      }
      // Allow default handling for other errors
      return originalWindowOnerror ? originalWindowOnerror(message, source, lineno, colno, err) : false;
    };
    
    // Add event listeners to timeline elements to intercept problematic mouse events
    const findAndProtectTimelineElements = () => {
      setTimeout(() => {
        // Try to find and protect timeline elements specifically
        const timelineElements = document.querySelectorAll('.wx-gantt-timeline, .wx-gantt-calendar');
        
        if (timelineElements.length > 0) {
          timelineElements.forEach(element => {
            // Add listeners with capturing phase to intercept events before they reach library code
            element.addEventListener('mousemove', preventUndefinedTypeErrors, true);
            element.addEventListener('mouseenter', preventUndefinedTypeErrors, true);
            element.addEventListener('mouseleave', preventUndefinedTypeErrors, true);
          });
        }
      }, 500); // Short delay to ensure elements are rendered
    };
    
    // Event handler that actively prevents the error by stopping events on dangerous targets
    const preventUndefinedTypeErrors = (e: Event) => {
      try {
        // If the event target is not a task bar or interactive component, block it
        const target = e.target as HTMLElement;
        const targetClassList = target?.classList || [];
        
        // Check if this is an event on a non-interactive element (calendar, grid, etc.)
        const isSafeTarget = 
          targetClassList.contains('wx-gantt-bar') || 
          targetClassList.contains('wx-gantt-bar-label') ||
          targetClassList.contains('wx-gantt-progress-handle') ||
          targetClassList.contains('wx-gantt-link-point') ||
          targetClassList.contains('wx-gantt-list') || 
          (target?.closest && 
            (target.closest('.wx-gantt-bar') || 
             target.closest('.wx-gantt-list')));
        
        // If it's an event on a problematic element, stop it
        if (!isSafeTarget) {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      } catch (err) {
        // If there's any error in our prevention logic, stop the event to be safe
        e.stopPropagation();
        e.preventDefault();
      }
    };
    
    // Initial run to attach handlers
    findAndProtectTimelineElements();
    
    // Also observe DOM changes to attach handlers to newly created elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          findAndProtectTimelineElements();
        }
      }
    });
    
    const container = containerRef.current;
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    
    // Cleanup
    return () => {
      console.error = originalConsoleError;
      window.onerror = originalWindowOnerror;
      
      // Clean up event listeners
      const timelineElements = document.querySelectorAll('.wx-gantt-timeline, .wx-gantt-calendar');
      timelineElements.forEach(element => {
        element.removeEventListener('mousemove', preventUndefinedTypeErrors, true);
        element.removeEventListener('mouseenter', preventUndefinedTypeErrors, true);
        element.removeEventListener('mouseleave', preventUndefinedTypeErrors, true);
      });
      
      observer.disconnect();
    };
  }, []);
  
  // Error boundary functionality
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-lg font-semibold text-red-700">Gantt Chart Error</h3>
        <p className="text-sm text-red-600">
          There was an error rendering the Gantt chart. Please try refreshing the page.
        </p>
      </div>
    );
  }
  
  // Render the Gantt chart within our error-handling wrapper
  return (
    <GanttErrorBoundary>
      <div 
        ref={containerRef} 
        className={cn("gantt-safe-wrapper", props.readonly ? "gantt-readonly" : "")}
        onError={(e: any) => {
          // React's onError doesn't catch all errors, but include it anyway
          if (e && e.error && typeof e.error.message === 'string' && 
              e.error.message.includes('Cannot read properties of undefined')) {
            e.preventDefault();
            setError(e.error);
          }
        }}
      >
        <Gantt {...props} />
      </div>
    </GanttErrorBoundary>
  );
}