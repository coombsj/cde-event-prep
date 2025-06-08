# CDE Event Preparation Scheduler

A Progressive Web App (PWA) designed to help equestrians plan and schedule their competition day. This application calculates and displays a timeline for grooming, tacking up, and warm-up times based on your event schedule.

## Features

- 🕒 Schedule multiple events with custom times
- ⏱️ Automatic calculation of preparation times
- 📱 Progressive Web App (PWA) support for offline use
- 📅 Google Calendar integration
- 🎨 Clean, responsive interface built with Tailwind CSS
- 📱 Installable on mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cde-event-prep.git
   cd cde-event-prep
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

### Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

### Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

## Usage

1. Add your events by clicking the "Add Event" button
2. For each event, specify:
   - Event name
   - Event time
   - Warm-up time (default: 30 minutes)
   - Tacking time (default: 10 minutes)
   - Grooming time (default: 10 minutes)
3. View your personalized schedule
4. Export to Google Calendar or print your schedule

## PWA Features

This app is installable as a Progressive Web App (PWA) on both mobile and desktop devices. When running in a supported browser, you'll see an install prompt to add the app to your home screen or applications menu.

## Technologies Used

- ⚛️ React 19
- 🔷 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 📱 PWA Capable
- 📅 Google Calendar Integration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
