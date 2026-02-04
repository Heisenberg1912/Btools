# Btools - Construction Intelligence Platform

AI-powered construction project analysis and management platform.

## Features

### 🎯 Core Functionality
- **AI-Powered Analysis**: Computer vision analysis of construction sites using Google Gemini Vision API
- **Progress Tracking**: Real-time project progress monitoring and reporting
- **Financial Analysis**: Budget tracking, cost forecasting, and ROI calculations
- **Safety & Compliance**: Automated safety inspection and compliance monitoring
- **Quality Control**: Defect detection and quality assurance

### 🚀 Pro Features (Phase 1)
- **Predictive Analytics**: Historical trend analysis and completion forecasting
- **Smart Alerts**: Automated notifications for budget, schedule, and safety thresholds
- **Portfolio Dashboard**: Multi-project management and comparison
- **Advanced Financials**: Cost forecasting and budget optimization
- **Custom Reports**: Build and schedule customized reports

### 🔐 Authentication & Subscriptions
- JWT-based authentication
- Two-tier subscription model (Free & Pro)
- Shared database architecture with marketplace integration
- Pro account management interface

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Fastify
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **AI**: Google Gemini Vision API

## Project Structure

```
btools/
├── src/                      # Frontend source
│   ├── components/          # React components
│   ├── pages/              # Page components (Login, Register)
│   ├── contexts/           # React contexts (Auth)
│   ├── lib/                # Utility libraries
│   └── types/              # TypeScript types
├── backend-node/            # Backend source
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── ai/        # AI analysis service
│   │   │   ├── auth/      # Authentication
│   │   │   ├── projects/  # Project management
│   │   │   ├── alerts/    # Alert rules
│   │   │   ├── portfolio/ # Portfolio analytics
│   │   │   └── reports/   # Report generation
│   │   ├── db/            # Database models & operations
│   │   └── config/        # Configuration
│   └── scripts/           # Utility scripts
└── package.json

```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Heisenberg1912/Btools.git
cd Btools
```

2. **Install dependencies**
```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

3. **Configure environment variables**

Create `.env` in the root directory:
```env
VITE_API_URL=http://localhost:3001/api
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Create `backend-node/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

4. **Start development servers**
```bash
# Start both frontend and backend concurrently
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Pro Account Management

A separate Pro account management interface is available at `D:\vitruvi-logins`:

```bash
cd D:\vitruvi-logins
npm start
```

Access at http://localhost:3002 to:
- Create Pro users
- Upgrade existing users
- Manage subscriptions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/analyze` - Analyze project image
- `GET /api/projects/:id/trends` - Get historical trends (Pro)
- `GET /api/projects/:id/forecast` - Get predictions (Pro)

### Alerts (Pro)
- `GET /api/alerts/templates` - Get alert templates
- `POST /api/projects/:id/alerts` - Create alert rule
- `GET /api/projects/:id/alerts` - List project alerts
- `PUT /api/alerts/:id` - Update alert rule
- `DELETE /api/alerts/:id` - Delete alert rule

### Portfolio (Pro)
- `GET /api/portfolio/summary` - Portfolio overview
- `GET /api/portfolio/comparison` - Compare projects
- `GET /api/portfolio/top-risks` - High-risk projects
- `GET /api/portfolio/resource-allocation` - Resource distribution

### Reports
- `POST /api/reports/pdf` - Generate PDF report
- `POST /api/reports/excel` - Generate Excel report
- `POST /api/reports/pptx` - Generate PowerPoint report

## Subscription Tiers

### Free Tier
- 3 scans per month
- 1 project
- Basic AI analysis
- Standard reports

### Pro Tier ($49-99/month)
- ✅ Unlimited scans
- ✅ Up to 10 projects
- ✅ Predictive Analytics
- ✅ Smart Alerts
- ✅ Portfolio Dashboard
- ✅ Advanced Financials
- ✅ Quality Control
- ✅ Custom Reports

## Development

### Build for production
```bash
# Build frontend
npm run build

# Build backend
cd backend-node && npm run build
```

### Run production build
```bash
# Frontend (after build)
npm run preview

# Backend
cd backend-node && npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software.

## Contact

Project Link: [https://github.com/Heisenberg1912/Btools](https://github.com/Heisenberg1912/Btools)

---

Built with ❤️ using Claude Code
