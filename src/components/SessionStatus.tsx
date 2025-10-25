import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { getTimeUntilExpiry, isSessionExpiringSoon, extendSession } from '@/utils/sessionManager';
import { getTimeoutDescription } from '@/config/sessionConfig';

interface SessionStatusProps {
  className?: string;
}

const SessionStatus: React.FC<SessionStatusProps> = ({ className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const time = getTimeUntilExpiry();
      setTimeLeft(time);
      setIsExpiringSoon(isSessionExpiringSoon());
    };

    // Update immediately
    updateTimeLeft();

    // Update every 15 seconds for more responsive display
    const interval = setInterval(updateTimeLeft, 15000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    extendSession();
    setTimeLeft(getTimeUntilExpiry());
    setIsExpiringSoon(false);
  };

  if (timeLeft <= 0) {
    return null; // Don't show if session is expired
  }

  const timeoutInfo = getTimeoutDescription();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {isExpiringSoon ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <Clock className="h-4 w-4 text-gray-500" />
        )}
        <span className={`text-sm ${isExpiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
          Session: {formatTime(timeLeft)}
        </span>
      </div>
      
      {isExpiringSoon && (
        <button
          onClick={handleExtendSession}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
          title={`Session expires in ${timeoutInfo.warningTime}. Click to extend.`}
        >
          Extend
        </button>
      )}
    </div>
  );
};

export default SessionStatus;
