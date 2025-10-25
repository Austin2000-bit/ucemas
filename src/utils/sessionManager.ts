import { supabase } from '@/lib/supabase';
import { SESSION_CONFIG } from '@/config/sessionConfig';

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = SESSION_CONFIG.SESSION_TIMEOUT; // 5 minutes - strict timeout
const WARNING_TIME = SESSION_CONFIG.WARNING_TIME; // 1 minute before expiry
const CHECK_INTERVAL = SESSION_CONFIG.CHECK_INTERVAL; // Check every 30 seconds
const TAB_SWITCH_TIMEOUT = SESSION_CONFIG.TAB_SWITCH_TIMEOUT; // 2 minutes for tab switching

// Session state
let sessionTimeoutId: NodeJS.Timeout | null = null;
let warningTimeoutId: NodeJS.Timeout | null = null;
let checkIntervalId: NodeJS.Timeout | null = null;
let tabSwitchTimeoutId: NodeJS.Timeout | null = null;
let lastActivity: number = Date.now();
let isTabVisible: boolean = true;
let lastTabSwitch: number = Date.now();

// Event listeners for user activity
const activityEvents = SESSION_CONFIG.ACTIVITY_EVENTS;

// Tab visibility and focus events
const visibilityEvents = SESSION_CONFIG.VISIBILITY_EVENTS;

// Session management class
class SessionManager {
  private static instance: SessionManager;
  private isWarningShown = false;
  private onSessionExpired?: () => void;
  private onSessionWarning?: () => void;

  private constructor() {
    this.setupActivityListeners();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Initialize session management
  public initialize(onSessionExpired?: () => void, onSessionWarning?: () => void) {
    this.onSessionExpired = onSessionExpired;
    this.onSessionWarning = onSessionWarning;
    this.startSessionTimer();
    this.startPeriodicCheck();
  }

  // Setup activity listeners to reset session timer
  private setupActivityListeners() {
    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), true);
    });
    
    // Setup visibility and focus listeners
    visibilityEvents.forEach(event => {
      if (event === 'visibilitychange') {
        document.addEventListener(event, this.handleVisibilityChange.bind(this), true);
      } else {
        window.addEventListener(event, this.handleVisibilityChange.bind(this), true);
      }
    });
  }

  // Handle user activity - reset session timer
  private handleUserActivity() {
    lastActivity = Date.now();
    this.resetSessionTimer();
  }

  // Handle visibility change and focus/blur events
  private handleVisibilityChange(event: Event) {
    const now = Date.now();
    
    if (event.type === 'visibilitychange') {
      isTabVisible = !document.hidden;
    } else if (event.type === 'blur' || event.type === 'pagehide') {
      isTabVisible = false;
      lastTabSwitch = now;
      this.startTabSwitchTimer();
    } else if (event.type === 'focus' || event.type === 'pageshow') {
      isTabVisible = true;
      const timeAway = now - lastTabSwitch;
      
      // If user was away for more than TAB_SWITCH_TIMEOUT, force logout
      if (timeAway > TAB_SWITCH_TIMEOUT) {
        this.handleSessionExpiry();
        return;
      }
      
      // Reset timers when returning to tab
      this.resetSessionTimer();
    }
  }

  // Start the session timer
  private startSessionTimer() {
    this.clearTimers();
    
    // Set warning timer
    warningTimeoutId = setTimeout(() => {
      this.showSessionWarning();
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set session expiry timer
    sessionTimeoutId = setTimeout(() => {
      this.handleSessionExpiry();
    }, SESSION_TIMEOUT);
  }

  // Start tab switch timer
  private startTabSwitchTimer() {
    if (tabSwitchTimeoutId) {
      clearTimeout(tabSwitchTimeoutId);
    }
    
    tabSwitchTimeoutId = setTimeout(() => {
      this.handleSessionExpiry();
    }, TAB_SWITCH_TIMEOUT);
  }

  // Reset session timer on user activity
  private resetSessionTimer() {
    if (this.isWarningShown) {
      this.hideSessionWarning();
    }
    this.startSessionTimer();
  }

  // Start periodic session check
  private startPeriodicCheck() {
    checkIntervalId = setInterval(() => {
      this.checkSessionValidity();
    }, CHECK_INTERVAL);
  }

  // Check if session is still valid
  private async checkSessionValidity() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        this.handleSessionExpiry();
        return;
      }

      // Check if session is expired
      const now = Date.now();
      const sessionExpiry = new Date(session.expires_at!).getTime();
      
      if (now >= sessionExpiry) {
        this.handleSessionExpiry();
        return;
      }

      // Check if user has been inactive for too long
      const timeSinceActivity = now - lastActivity;
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        this.handleSessionExpiry();
        return;
      }

      // Check if tab has been hidden for too long
      if (!isTabVisible) {
        const timeSinceTabSwitch = now - lastTabSwitch;
        if (timeSinceTabSwitch >= TAB_SWITCH_TIMEOUT) {
          this.handleSessionExpiry();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session validity:', error);
      this.handleSessionExpiry();
    }
  }

  // Show session warning
  private showSessionWarning() {
    if (this.isWarningShown) return;
    
    this.isWarningShown = true;
    
    // Create warning modal
    const warningModal = document.createElement('div');
    warningModal.id = 'session-warning-modal';
    warningModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const warningContent = document.createElement('div');
    warningContent.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    `;

    warningContent.innerHTML = `
      <h3 style="margin: 0 0 1rem 0; color: #f59e0b;">Session Expiring Soon</h3>
      <p style="margin: 0 0 1.5rem 0; color: #6b7280;">
        Your session will expire in 1 minute due to inactivity or tab switching. 
        Click "Stay Logged In" to continue your session.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="stay-logged-in" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">Stay Logged In</button>
        <button id="logout-now" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">Logout Now</button>
      </div>
    `;

    warningModal.appendChild(warningContent);
    document.body.appendChild(warningModal);

    // Add event listeners
    document.getElementById('stay-logged-in')?.addEventListener('click', () => {
      this.hideSessionWarning();
      this.resetSessionTimer();
    });

    document.getElementById('logout-now')?.addEventListener('click', () => {
      this.hideSessionWarning();
      this.handleSessionExpiry();
    });

    // Call custom warning handler if provided
    if (this.onSessionWarning) {
      this.onSessionWarning();
    }
  }

  // Hide session warning
  private hideSessionWarning() {
    const warningModal = document.getElementById('session-warning-modal');
    if (warningModal) {
      warningModal.remove();
    }
    this.isWarningShown = false;
  }

  // Handle session expiry
  private async handleSessionExpiry() {
    this.clearTimers();
    this.hideSessionWarning();
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any stored data
      localStorage.removeItem('supabase.auth.token');
      
      // Call custom expiry handler if provided
      if (this.onSessionExpired) {
        this.onSessionExpired();
      } else {
        // Default behavior - redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during session expiry:', error);
      // Force redirect even if signout fails
      window.location.href = '/login';
    }
  }

  // Clear all timers
  private clearTimers() {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
      sessionTimeoutId = null;
    }
    if (warningTimeoutId) {
      clearTimeout(warningTimeoutId);
      warningTimeoutId = null;
    }
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
    if (tabSwitchTimeoutId) {
      clearTimeout(tabSwitchTimeoutId);
      tabSwitchTimeoutId = null;
    }
  }

  // Manually extend session
  public extendSession() {
    this.resetSessionTimer();
  }

  // Manually logout
  public async logout() {
    this.clearTimers();
    this.hideSessionWarning();
    await this.handleSessionExpiry();
  }

  // Get time until session expires
  public getTimeUntilExpiry(): number {
    const timeSinceActivity = Date.now() - lastActivity;
    return Math.max(0, SESSION_TIMEOUT - timeSinceActivity);
  }

  // Check if session is about to expire
  public isSessionExpiringSoon(): boolean {
    return this.getTimeUntilExpiry() <= WARNING_TIME;
  }

  // Cleanup - remove event listeners
  public destroy() {
    this.clearTimers();
    this.hideSessionWarning();
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity.bind(this), true);
    });
    
    visibilityEvents.forEach(event => {
      if (event === 'visibilitychange') {
        document.removeEventListener(event, this.handleVisibilityChange.bind(this), true);
      } else {
        window.removeEventListener(event, this.handleVisibilityChange.bind(this), true);
      }
    });
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export utility functions
export const initializeSessionManager = (
  onSessionExpired?: () => void,
  onSessionWarning?: () => void
) => {
  sessionManager.initialize(onSessionExpired, onSessionWarning);
};

export const extendSession = () => {
  sessionManager.extendSession();
};

export const logout = () => {
  sessionManager.logout();
};

export const getTimeUntilExpiry = () => {
  return sessionManager.getTimeUntilExpiry();
};

export const isSessionExpiringSoon = () => {
  return sessionManager.isSessionExpiringSoon();
};
