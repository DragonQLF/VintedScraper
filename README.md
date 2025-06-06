# Vinted Tracker

A full-stack web application for automatically tracking Vinted listings based on custom filters.

## Features

- User authentication and profile management
- Custom search profiles with advanced filtering
- Automated Vinted listing monitoring
- Real-time notifications for new matches
- Interactive dashboard for matched items
- Manual and automated actions (favorite, offer, buy)
- Responsive design for mobile and desktop

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Query
- React Router

### Backend
- Node.js
- Express
- TypeScript
- MySQL
- Prisma ORM
- Puppeteer for web scraping

## Project Structure

```
vinted-tracker/
├── backend/           # Node.js/Express backend
├── frontend/         # React frontend
└── docs/            # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/vinted-tracker.git
cd vinted-tracker
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
```bash
# Backend (.env)
cp backend/.env.example backend/.env
# Edit .env with your configuration

# Frontend (.env)
cp frontend/.env.example frontend/.env
# Edit .env with your configuration
```

5. Initialize the database
```bash
cd backend
npx prisma migrate dev
```

6. Start the development servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Development

### Backend Development
- API documentation available at `/api/docs` when running in development
- Database migrations are handled through Prisma
- Scraping jobs run on a configurable schedule

### Frontend Development
- Built with React and TypeScript
- Uses Tailwind CSS for styling
- Implements responsive design patterns

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 