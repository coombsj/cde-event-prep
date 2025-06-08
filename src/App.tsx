import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Calendar, Plus, Trash2, Download, Info } from 'lucide-react';
import About from './pages/About';

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
  const [eventForm, setEventForm] = useState({
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
      e.preventDefault();
      const beforeInstallEvent = e as unknown as BeforeInstallPromptEvent;
      setInstallPrompt(beforeInstallEvent);
      setShowInstallBanner(true);
    };

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
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      console.log(`User response: ${choiceResult.outcome}`);
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
    
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
    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]|\.\d+/g, '').replace('T', '') + 'Z';
    };

    const details = [
      `Grooming: ${event.groomingStart} (${event.groomingTime} min)`,
      `Tacking: ${event.tackingStart} (${event.tackingTime} min)`,
      `Warm Up: ${event.warmUpStart} (${event.warmUpTime} min)`,
      `Event: ${event.eventStart}`
    ].join('\n');

    const startTime = parseTime(event.eventStart);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.eventName);
    url.searchParams.append('details', details);
    url.searchParams.append('dates', `${formatDate(startTime)}/${formatDate(endTime)}`);
    
    return url.toString();
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Event</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input
              type="text"
              name="eventName"
              value={eventForm.eventName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., Dressage Test A"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
            <input
              type="time"
              name="eventTime"
              value={eventForm.eventTime}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warm-up (min)</label>
            <input
              type="number"
              name="warmUpTime"
              min="0"
              value={eventForm.warmUpTime}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tacking (min)</label>
            <input
              type="number"
              name="tackingTime"
              min="0"
              value={eventForm.tackingTime}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grooming (min)</label>
            <input
              type="number"
              name="groomingTime"
              min="0"
              value={eventForm.groomingTime}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
        >
          <Plus size={18} className="mr-2" />
          Add Event
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Scheduled Events</h2>
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{event.eventName}</h3>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Delete event"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-medium">Grooming</div>
                  <div>{event.groomingStart} ({event.groomingTime} min)</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-medium">Tacking</div>
                  <div>{event.tackingStart} ({event.tackingTime} min)</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="font-medium">Warm Up</div>
                  <div>{event.warmUpStart} ({event.warmUpTime} min)</div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="font-medium">Event</div>
                  <div>{event.eventStart}</div>
                </div>
              </div>
              <div className="mt-3">
                <a
                  href={createGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Calendar size={16} className="mr-1" />
                  Add to Google Calendar
                </a>
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

      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-3 flex items-center justify-between z-40">
          <div className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            <span>Install this app for a better experience</span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={dismissInstallBanner}
              className="px-3 py-1 bg-white/20 rounded hover:bg-white/30"
            >
              Not Now
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-white/90"
            >
              Install
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-700 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold hover:text-blue-100">CDE Event Scheduler</Link>
            </div>
            <nav>
              <Link to="/about" className="flex items-center space-x-1 hover:text-blue-200">
                <Info size={20} />
                <span>About</span>
              </Link>
            </nav>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/" element={<EventScheduler />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
