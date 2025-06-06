import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ScraperStatus {
  profileId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  totalProfiles: number;
  currentProfile: string;
  lastError?: string;
  lastRun?: string;
  currentPage: number;
  itemsProcessedOnCurrentPage: number;
  totalItemsProcessedForProfile: number;
  notificationQueueSize: number;
  rateLimit?: boolean;
  rateLimitWaitTime?: number;
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-400 text-white',
  running: 'bg-blue-500 text-white',
  completed: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
};

const API_BASE_URL = '';

const ScraperStatus: React.FC = () => {
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [error, setError] = useState<Event | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/scraper/status/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data);
        setError(null);
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      setError(err);
      eventSource.close();
    };

    eventSource.onopen = () => {
        console.log('SSE connection opened for scraper status.');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!status) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Loading status...</div>;
  }

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <div className="flex items-center gap-2">
         <span className="font-semibold">Scraper:</span> 
         <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[status.status]}`}>{status.status.toUpperCase()}</span>
         {status.status === 'running' && (
             <span>{status.progress}%</span>
         )}
      </div>
      
      {status.status === 'running' && (
          <div className="text-xs mt-1">
              Profile: {status.currentProfile} (Page {status.currentPage}, {status.itemsProcessedOnCurrentPage} items) | Total Processed: {status.totalItemsProcessedForProfile}
          </div>
      )}

      <div className="text-xs mt-1">
          Queue: {status.notificationQueueSize} items
          {status.rateLimit && (
              <span className="ml-2 text-yellow-500">
                  (Rate limited, waiting {Math.ceil(status.rateLimitWaitTime! / 1000)}s)
              </span>
          )}
      </div>

      {status.lastRun && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Last Run: {formatDistanceToNow(new Date(status.lastRun), { addSuffix: true })} ago
        </div>
      )}

      {status.status === 'error' && status.lastError && (
        <div className="text-xs text-red-500 mt-1">
          Error: {status.lastError}
        </div>
      )}
       {error && (
           <div className="text-xs text-red-500 mt-1">
               Connection Error: {error.type}
           </div>
       )}
    </div>
  );
};

export default ScraperStatus; 