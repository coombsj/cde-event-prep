import { useEffect, useState } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatus = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOnline) {
      setMessage('You are currently offline. Some features may be limited.');
      setIsVisible(true);
    } else if (wasOffline) {
      setMessage('Back online! Your connection has been restored.');
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg flex items-start gap-3 ${
      !isOnline 
        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
        : 'bg-green-50 border border-green-200 text-green-800'
    }`}>
      <div className="mt-0.5">
        {!isOnline ? (
          <WifiOff className="w-5 h-5" />
        ) : (
          <Wifi className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 text-sm">
        <p className="font-medium">
          {!isOnline ? 'Offline Mode' : 'Back Online'}
        </p>
        <p>{message}</p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
