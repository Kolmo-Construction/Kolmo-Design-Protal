/**
 * Client-side analytics tracking for quotes
 * Automatically captures: opens, clicks, scrolls, time spent, re-visits
 */

interface AnalyticsEvent {
  event: string;
  eventData?: Record<string, any>;
  sessionId: string;
  timeOnPage?: number;
  scrollDepth?: number;
}

let sessionId = '';
let sessionStartTime = 0;
let maxScrollDepth = 0;
let lastActivityTime = 0;
const visitedSections = new Set<string>();
const performedActions: string[] = [];

/**
 * Initialize analytics for a quote
 */
export function initializeQuoteAnalytics(quoteId: number) {
  // Generate or retrieve session ID
  sessionId = generateSessionId();
  sessionStartTime = Date.now();
  lastActivityTime = Date.now();
  maxScrollDepth = 0;
  visitedSections.clear();
  performedActions.length = 0;

  // Create or update session
  trackSession(quoteId);

  // Setup scroll tracking
  setupScrollTracking(quoteId);

  // Setup click tracking
  setupClickTracking(quoteId);

  // Setup time tracking
  setupTimeTracking(quoteId);

  // Track page view
  trackEvent(quoteId, 'view', {
    viewType: 'initial_load'
  });

  // Send session end on page unload
  window.addEventListener('beforeunload', () => {
    const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
    updateSessionDuration(quoteId, sessionDuration, Math.max(0, maxScrollDepth), Array.from(visitedSections), performedActions);
  });
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  if (!sessionId) {
    const stored = sessionStorage.getItem('quote_session_id');
    if (stored) {
      return stored;
    }
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('quote_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track a generic event
 */
export async function trackEvent(
  quoteId: number,
  event: string,
  eventData?: Record<string, any>
) {
  try {
    lastActivityTime = Date.now();

    const response = await fetch(`/api/quotes/${quoteId}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer
        },
        sessionId: generateSessionId(),
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        screenResolution: `${window.innerWidth}x${window.innerHeight}`
      })
    });

    if (!response.ok) {
      console.error('Failed to track event:', response.statusText);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Track session creation/update
 */
async function trackSession(quoteId: number) {
  try {
    await fetch(`/api/quotes/${quoteId}/analytics/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: generateSessionId(),
        userAgent: navigator.userAgent,
        deviceFingerprint: generateDeviceFingerprint()
      })
    });
  } catch (error) {
    console.error('Error creating session:', error);
  }
}

/**
 * Setup scroll depth tracking
 */
function setupScrollTracking(quoteId: number) {
  let scrollTimeout: NodeJS.Timeout;

  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);

    const scrollDepth = calculateScrollDepth();
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
    }

    // Debounce scroll updates
    scrollTimeout = setTimeout(() => {
      updateScrollDepth(quoteId, maxScrollDepth);
    }, 1000);
  });
}

/**
 * Setup click tracking
 */
function setupClickTracking(quoteId: number) {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    // Track specific elements
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('[data-testid]')) {
      const testId = target.getAttribute('data-testid') || target.tagName.toLowerCase();
      const action = `click_${testId}`;

      if (!performedActions.includes(action)) {
        performedActions.push(action);
      }

      trackEvent(quoteId, 'click', {
        element: testId,
        text: target.textContent?.substring(0, 100),
        className: target.className
      });

      // Track specific sections
      const section = target.closest('[data-section]');
      if (section) {
        const sectionName = section.getAttribute('data-section');
        if (sectionName) {
          visitedSections.add(sectionName);
        }
      }
    }
  });
}

/**
 * Setup time on page tracking
 */
function setupTimeTracking(quoteId: number) {
  setInterval(() => {
    const timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);

    // Update periodically (every 30 seconds)
    if (timeOnPage % 30 === 0) {
      updateSessionDuration(quoteId, timeOnPage, maxScrollDepth, Array.from(visitedSections), performedActions);
    }
  }, 5000);
}

/**
 * Update session duration
 */
async function updateSessionDuration(
  quoteId: number,
  duration: number,
  scrollDepth: number,
  sectionsViewed: string[],
  actions: string[]
) {
  try {
    await fetch(`/api/analytics/session/duration`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId,
        sessionId: generateSessionId(),
        totalDuration: duration,
        maxScrollDepth: scrollDepth,
        sectionsViewed,
        actionsPerformed: actions
      })
    });
  } catch (error) {
    console.error('Error updating session duration:', error);
  }
}

/**
 * Update scroll depth
 */
async function updateScrollDepth(quoteId: number, scrollDepth: number) {
  try {
    await fetch(`/api/analytics/session/scroll`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId,
        sessionId: generateSessionId(),
        scrollDepth
      })
    });
  } catch (error) {
    console.error('Error updating scroll depth:', error);
  }
}

/**
 * Calculate scroll depth percentage
 */
function calculateScrollDepth(): number {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight - windowHeight;
  const scrolled = window.scrollY;

  if (documentHeight === 0) return 100;
  return Math.round((scrolled / documentHeight) * 100);
}

/**
 * Get device type
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    window.innerWidth + 'x' + window.innerHeight,
    navigator.hardwareConcurrency || 'unknown'
  ];

  return parts.join('|');
}

/**
 * Track specific section view
 */
export function trackSectionView(quoteId: number, sectionName: string) {
  visitedSections.add(sectionName);
  trackEvent(quoteId, 'section_view', { section: sectionName });
}

/**
 * Track document download
 */
export function trackDownload(quoteId: number, fileName: string) {
  performedActions.push(`download_${fileName}`);
  trackEvent(quoteId, 'download', { fileName });
}

/**
 * Track response action (accept/decline)
 */
export function trackResponse(quoteId: number, action: string) {
  performedActions.push(`response_${action}`);
  trackEvent(quoteId, 'response_click', { action });
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
  return generateSessionId();
}
