// Session configuration for strict security
export const SESSION_CONFIG = {
  // Main session timeout (5 minutes)
  SESSION_TIMEOUT: 5 * 60 * 1000,
  
  // Warning time before expiry (1 minute)
  WARNING_TIME: 1 * 60 * 1000,
  
  // Check interval for session validation (30 seconds)
  CHECK_INTERVAL: 30 * 1000,
  
  // Tab switch timeout (2 minutes)
  TAB_SWITCH_TIMEOUT: 2 * 60 * 1000,
  
  // Activity detection events
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ],
  
  // Visibility and focus events
  VISIBILITY_EVENTS: [
    'visibilitychange',
    'focus',
    'blur',
    'pageshow',
    'pagehide'
  ],
  
  // Security settings
  SECURITY: {
    // Force logout on tab switch after this time
    FORCE_LOGOUT_ON_TAB_SWITCH: true,
    
    // Force logout on inactivity after this time
    FORCE_LOGOUT_ON_INACTIVITY: true,
    
    // Show warning before logout
    SHOW_WARNING: true,
    
    // Allow session extension
    ALLOW_EXTENSION: true
  }
};

// Helper function to get human-readable timeout
export const getTimeoutDescription = () => {
  const minutes = SESSION_CONFIG.SESSION_TIMEOUT / (60 * 1000);
  const tabMinutes = SESSION_CONFIG.TAB_SWITCH_TIMEOUT / (60 * 1000);
  
  return {
    sessionTimeout: `${minutes} minutes`,
    tabSwitchTimeout: `${tabMinutes} minutes`,
    warningTime: `${SESSION_CONFIG.WARNING_TIME / (60 * 1000)} minutes`
  };
};
