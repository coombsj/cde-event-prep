import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { Calendar, Plus, Trash2, Download } from 'lucide-react';

// Check if the app is running in standalone mode (installed as PWA)
// Extend the Window interface to include the standalone property
declare global {
  interface Navigator {
    standalone?: boolean;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
  interface Window {
    beforeinstallprompt?: (e: BeforeInstallPromptEvent) => void;
  }
}

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;

const EventScheduler = () => {
  // Define the Event type
  interface EventItem {
    id: number;
    eventName: string;
    eventTime: string;
    warmUpTime: number;
    tackingTime: number;
    groomingTime: number;
    groomingStart: string;
    tackingStart: string;
    warmUpStart: string;
    eventStart: string;
  }

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventForm, setEventForm] = useState<{
    eventName: string;
    eventTime: string;
    warmUpTime: number;
    tackingTime: number;
    groomingTime: number;
  }>({
    eventName: '',
    eventTime: '',
    warmUpTime: 30,
    tackingTime: 10,
    groomingTime: 10
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Handle PWA install prompt
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('App was installed');
      setShowInstallBanner(false);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      const beforeInstallEvent = e as unknown as BeforeInstallPromptEvent;
      setInstallPrompt(beforeInstallEvent);
      setShowInstallBanner(true);
    };

    // Type assertion for the custom event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleInstallClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!installPrompt) return;
    
    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${choiceResult.outcome}`);
      
      // We've used the prompt, and can't use it again, throw it away
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
    
    // Hide the install banner
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventForm.eventName || !eventForm.eventTime) {
      alert('Please enter event name and time');
      return;
    }

    const times = calculateTimes(eventForm);
    const newEvent = {
      ...eventForm,
      id: Date.now(),
      ...times,
      eventStart: eventForm.eventTime
    };

    setEvents([...events, newEvent]);
    setEventForm({
      eventName: '',
      eventTime: '',
      warmUpTime: 30,
      tackingTime: 10,
      groomingTime: 10
    });
  };

  const calculateTimes = (event: {
    eventTime: string;
    warmUpTime: number;
    tackingTime: number;
    groomingTime: number;
  }) => {
    const eventDateTime = new Date(`2024-01-01T${event.eventTime}`);
    
    // Calculate start times by working backwards from event time
    const totalPrepTime = event.warmUpTime + event.tackingTime + event.groomingTime;
    
    const groomingStart = new Date(eventDateTime.getTime() - totalPrepTime * 60000);
    const tackingStart = new Date(eventDateTime.getTime() - (event.warmUpTime + event.tackingTime) * 60000);
    const warmUpStart = new Date(eventDateTime.getTime() - event.warmUpTime * 60000);

    return {
      groomingStart: groomingStart.toTimeString().slice(0, 5),
      tackingStart: tackingStart.toTimeString().slice(0, 5),
      warmUpStart: warmUpStart.toTimeString().slice(0, 5),
      eventStart: event.eventTime
    };
  };

  const deleteEvent = (id: number) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const createGoogleCalendarUrl = (event: EventItem) => {
    // Convert time strings to Date objects for calculations
    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Format date for Google Calendar
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]|\..+$/g, '').replace('T', '') + 'Z';
    };

    // Create event details
    const details = [
      `Grooming: ${event.groomingStart} (${event.groomingTime} min)`,
      `Tacking: ${event.tackingStart} (${event.tackingTime} min)`,
      `Warm Up: ${event.warmUpStart} (${event.warmUpTime} min)`,
      `Event: ${event.eventStart}`
    ].join('\n');

    // Calculate start and end times (1 hour duration for the main event)
    const startTime = parseTime(event.eventStart);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // Create Google Calendar URL
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.eventName);
    url.searchParams.append('details', details);
    url.searchParams.append('dates', `${formatDate(startTime)}/${formatDate(endTime)}`);
    url.searchParams.append('sf', 'true');
    url.searchParams.append('output', 'xml');

    return url.toString();
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Calendar size={32} className="text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">CDE Event Scheduler</h1>
        </div>
        
        {showInstallBanner && !isStandalone && (
          <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-3 flex items-center justify-between z-40">
            <div className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              <span>Install this app for a better experience</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={dismissInstallBanner}
                className="px-3 py-1 text-sm bg-blue-700 rounded hover:bg-blue-800 transition-colors"
              >
                Not Now
              </button>
              <button 
                onClick={handleInstallClick}
                className="px-3 py-1 text-sm bg-white text-blue-700 rounded hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={eventForm.eventName}
                onChange={handleInputChange}
                name="eventName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter event name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Time
              </label>
              <input
                type="time"
                value={eventForm.eventTime}
                onChange={handleInputChange}
                name="eventTime"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warm Up Time (minutes)
              </label>
              <input
                type="number"
                value={eventForm.warmUpTime}
                onChange={handleInputChange}
                name="warmUpTime"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tacking Time (minutes)
              </label>
              <input
                type="number"
                value={eventForm.tackingTime}
                onChange={handleInputChange}
                name="tackingTime"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grooming Time (minutes)
              </label>
              <input
                type="number"
                value={eventForm.groomingTime}
                onChange={handleInputChange}
                name="groomingTime"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Event
              </button>
            </div>
          </div>
        </form>

        {/* Events List */}
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{event.eventName}</h2>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Grooming:</span>
                    <span className="font-medium">{formatTime(event.groomingStart)} ({event.groomingTime} min)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tacking:</span>
                    <span className="font-medium">{formatTime(event.tackingStart)} ({event.tackingTime} min)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Warm Up:</span>
                    <span className="font-medium">{formatTime(event.warmUpStart)} ({event.warmUpTime} min)</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold mt-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-700">Event Start:</span>
                    <span className="text-indigo-600">{formatTime(event.eventStart)}</span>
                  </div>
                  <div className="mt-4">
                    <a
                      href={createGoogleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <Calendar size={16} className="mr-1" />
                      Add to Google Calendar
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No events scheduled yet. Add your first event above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventScheduler;