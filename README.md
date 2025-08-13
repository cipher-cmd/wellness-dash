# 🍽️ WellnessDash - India-first Nutrition Tracker

**Intelligent Vitality for your health journey**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/wellnessdash)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

### 🧠 **AI-Powered Meal Planning**

- **Personalized Nutrition Plans** based on your BMI, goals, and preferences
- **Indian Cuisine Focus** with traditional and modern recipes
- **Smart Recommendations** using OpenRouter and Groq AI APIs
- **7-Day Meal Plans** with nutritional breakdown

### 🍛 **Comprehensive Food Database**

- **Indian Food Database** with 100+ traditional items
- **USDA Integration** for international foods
- **Open Food Facts** for global nutrition data
- **Custom Food Creator** for personal recipes

### 📊 **Advanced Nutrition Tracking**

- **Real-time Calorie Counting** with macro tracking
- **Meal-based Logging** (Breakfast, Lunch, Dinner, Snacks)
- **Progress Visualization** with interactive charts
- **Goal Setting** and achievement tracking

### 👤 **Complete User Management**

- **Google OAuth Integration** for seamless login
- **Profile Management** with health metrics
- **Goal Customization** based on activity level
- **Data Persistence** across devices

### 📱 **Progressive Web App (PWA)**

- **Offline Functionality** with service worker
- **Install to Home Screen** like native apps
- **Push Notifications** for meal reminders
- **Responsive Design** for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter API key
- Groq API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wellnessdash.git
cd wellnessdash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

### Frontend Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Dexie.js** for IndexedDB management

### Data Management

- **Supabase** for authentication and cloud data
- **IndexedDB** for offline-first experience
- **Local Storage** for user preferences
- **Service Worker** for caching and offline support

### Performance Features

- **Code Splitting** with dynamic imports
- **Lazy Loading** for non-critical components
- **Service Worker Caching** for offline access
- **Image Optimization** with WebP support

## 📱 PWA Features

### Installation

Users can install WellnessDash as a native app:

- **Mobile**: Add to Home Screen from browser menu
- **Desktop**: Install button in browser address bar
- **Offline Access**: Core functionality works without internet

### Service Worker

- **Caching Strategy**: Cache-first for static assets
- **Background Sync**: Sync offline data when online
- **Push Notifications**: Meal reminders and updates

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Manual Deployment

```bash
# Build the project
npm run build

# Upload dist/ folder to your hosting provider
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable Google OAuth in Authentication > Providers
3. Add redirect URLs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
4. Copy project URL and anon key to environment variables

### Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### PWA Configuration

The app automatically generates:

- **Web App Manifest** with proper icons
- **Service Worker** for offline functionality
- **Meta Tags** for social sharing

## 📊 Performance

### Build Optimization

- **Tree Shaking** removes unused code
- **Code Splitting** reduces initial bundle size
- **Asset Optimization** with compression
- **Lazy Loading** for better perceived performance

### Runtime Performance

- **Virtual Scrolling** for large lists
- **Debounced Search** for better UX
- **Optimistic Updates** for responsive feel
- **Background Processing** for heavy operations

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📈 Monitoring

### Analytics

- **Performance Metrics** with Core Web Vitals
- **Error Tracking** with Error Boundaries
- **User Analytics** with privacy-first approach

### Health Checks

- **Service Worker** status monitoring
- **Database** connection health
- **API** endpoint availability

## 🔒 Security

### Authentication

- **OAuth 2.0** with Google
- **JWT Tokens** for session management
- **Secure Storage** for sensitive data

### Data Protection

- **HTTPS Only** in production
- **Input Validation** and sanitization
- **XSS Protection** with React's built-in security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for backend infrastructure
- **OpenRouter** and **Groq** for AI capabilities
- **Tailwind CSS** for beautiful styling
- **Framer Motion** for smooth animations
- **Dexie.js** for offline database management

## 📞 Support

- **Documentation**: [docs.wellnessdash.com](https://docs.wellnessdash.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/wellnessdash/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/wellnessdash/discussions)
- **Email**: support@wellnessdash.com

---

**Made with ❤️ for healthy living**
