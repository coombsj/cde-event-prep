import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <nav className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to Event Scheduler
        </Link>
      </nav>
      
      <h1 className="text-3xl font-bold mb-6 text-center">About CDE Event Scheduler</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">What is CDE Event Scheduler?</h2>
          <p className="mb-4">
            The CDE Event Scheduler is a specialized tool designed to help competitors and organizers of Combined Driving Events (CDE) 
            manage their competition day schedules more efficiently. Whether you're a driver, groom, or organizer, this app helps you 
            plan and visualize the timing of your events with precision.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Key Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Schedule multiple events with custom preparation times</li>
            <li>Calculate and visualize grooming, tacking, and warm-up times</li>
            <li>Export your schedule to Google Calendar with a single click</li>
            <li>Works offline - perfect for use at competition venues with spotty internet</li>
            <li>Install as a Progressive Web App (PWA) for quick access from your home screen</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">How to Use</h2>
          <ol className="list-decimal pl-5 space-y-3">
            <li>Add your competition events with their scheduled start times</li>
            <li>Set your preferred preparation times for grooming, tacking, and warm-up</li>
            <li>The app will automatically calculate when you need to start each preparation phase</li>
            <li>Export your schedule to Google Calendar for easy reference</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">About Combined Driving</h2>
          <p className="mb-4">
            Combined Driving is an equestrian sport where a horse or pony pulls a carriage driven by a driver. 
            The sport consists of three phases: dressage, marathon, and cones. Proper timing and preparation are 
            crucial for success in competition.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
