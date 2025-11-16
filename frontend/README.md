# RONIN Frontend

React/TypeScript web application for the RONIN autonomous safety monitoring system.

## Technologies

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Recharts** - Data visualization
- **TanStack Query** - Data fetching

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # React components
│   │   ├── ui/       # shadcn/ui components
│   │   └── ...       # Custom RONIN components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Entry point
├── package.json
└── vite.config.ts
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

- **Dashboard** - Real-time safety monitoring and hazard score visualization
- **Rover Console** - Live camera feed and rover control
- **Alerts** - Alert management and history
- **History** - Historical sensor data and logs
- **Settings** - System configuration and thresholds

## Firebase Integration

_Coming soon - Firebase Realtime Database integration for live data streaming_

