# 🥗 WellnessDash - Complete Indian Nutrition Tracking App

A comprehensive, AI-powered nutrition tracking application designed specifically for Indian cuisine and dietary preferences. Built with React, TypeScript, and modern web technologies.

## ✨ **Features**

### 🧠 **AI-Powered Meal Planning**
- **Personalized Meal Plans**: AI generates 7-day meal plans based on your BMI, goals, and preferences
- **Indian Cuisine Focus**: Specialized in traditional Indian foods and cooking methods
- **Smart Recommendations**: Considers dietary restrictions, favorite foods, and meal timing
- **Nutritional Analysis**: AI provides detailed nutritional breakdown for each meal

### 🍽️ **Comprehensive Food Database**
- **50+ Indian Foods**: Pre-loaded with traditional Indian ingredients and meals
- **External APIs**: Integration with USDA and Open Food Facts databases
- **Smart Search**: Fast local search with intelligent fallback to external sources
- **Custom Foods**: Add your own food items with nutritional information

### 📊 **Advanced Nutrition Tracking**
- **Daily Summary**: Visual progress indicators for calories, protein, carbs, and fat
- **Meal Categorization**: Breakfast, lunch, dinner, and snacks with smart tips
- **Goal Management**: Personalized daily targets based on your profile
- **Progress Charts**: Visual representation of your nutrition journey

### 👤 **Complete User Management**
- **Profile Management**: Edit personal information, goals, and preferences
- **Local Storage**: Data persistence without external dependencies
- **Responsive Design**: Works perfectly on all devices
- **Modern UI/UX**: Beautiful animations and micro-interactions

### 🛒 **Meal Planning & Shopping**
- **Meal Planner**: Plan your weekly meals with drag-and-drop interface
- **Shopping List Generator**: AI-generated shopping lists based on meal plans
- **Recipe Management**: Store and organize your favorite recipes
- **Portion Control**: Smart serving size recommendations

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation
```bash
# Clone the repository
git clone https://github.com/cipher-cmd/wellness-dash.git
cd wellness-dash

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Create a `.env` file in the root directory:
```env
# AI Service (Optional - for meal planning)
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_GROQ_API_KEY=your_groq_key_here

# External Food APIs (Optional)
VITE_USDA_API_KEY=your_usda_key_here
```

## 🏗️ **Architecture**

### **Frontend Stack**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Vite** - Fast build tool and dev server

### **Data Management**
- **IndexedDB (Dexie.js)** - Local database for offline functionality
- **Local Storage** - User preferences and settings persistence
- **External APIs** - USDA and Open Food Facts integration
- **AI Services** - OpenRouter and Groq integration

### **Performance Features**
- **Local-First Search** - Sub-50ms response times
- **Smart Caching** - 30-minute TTL for external API results
- **Lazy Loading** - Components load on demand
- **Optimized Bundles** - Code splitting and tree shaking

## 📱 **User Interface**

### **Navigation**
- **Responsive Design**: 2-line layout on mobile, single-line on desktop
- **Smart Tabs**: Food Diary, Goals, Progress with smooth transitions
- **Action Buttons**: Add Food, Generate Meal Plan, Profile access
- **Modern Styling**: Gradient backgrounds, shadows, and hover effects

### **Components**
- **Enhanced Meal Sections**: Smart tips and sample foods for empty states
- **Daily Summary**: Visual progress bars and motivational messages
- **Profile Modal**: Comprehensive user management with tabs
- **AI Meal Plan Modal**: Rich content display with action buttons

## 🔧 **Technical Features**

### **Database Schema**
```typescript
// Core data types
interface Food {
  id?: number;
  name: string;
  brand?: string;
  category?: string;
  tags?: string[];
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servings?: { label: string; grams: number }[];
  verified?: boolean;
  source?: 'user' | 'external' | 'ai';
}

interface DiaryEntry {
  id?: number;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId?: number;
  customName?: string;
  grams?: number;
  quantity?: number;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  bmi: number;
  goal: 'lose' | 'maintain' | 'gain';
  daily_targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
```

### **AI Integration**
- **Meal Planning Context**: Comprehensive user profile analysis
- **Smart Prompts**: Specialized for Indian nutrition and cuisine
- **Fallback Handling**: Multiple AI providers for reliability
- **Error Recovery**: Graceful degradation when AI services are unavailable

### **Performance Optimizations**
- **Search Algorithms**: Exact match → Partial match → Tag search → Fuzzy search
- **Caching Strategy**: Local cache with intelligent expiration
- **Batch Operations**: Efficient database operations
- **Memory Management**: Automatic cleanup of expired data

## 🎯 **Use Cases**

### **For Individuals**
- Track daily nutrition intake
- Plan healthy Indian meals
- Monitor weight and fitness goals
- Discover new healthy foods

### **For Families**
- Plan weekly meal schedules
- Generate shopping lists
- Track multiple family members
- Share favorite recipes

### **For Health Professionals**
- Monitor client nutrition
- Generate personalized meal plans
- Track progress over time
- Export data for analysis

## 🔒 **Privacy & Security**

- **Local-First**: All data stored locally on your device
- **No External Tracking**: No analytics or user behavior tracking
- **Optional Cloud Sync**: Choose to sync with external services
- **Data Export**: Full control over your data

## 🚀 **Deployment**

### **Local Development**
```bash
npm run dev
# App runs on http://localhost:5173
```

### **Production Build**
```bash
npm run build
# Optimized files in dist/ directory
```

### **PWA Features**
- **Offline Support**: Works without internet connection
- **Installable**: Add to home screen on mobile devices
- **Service Worker**: Background sync and caching
- **Manifest**: App-like experience

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Indian Food Database**: Comprehensive coverage of traditional foods
- **AI Services**: OpenRouter and Groq for intelligent meal planning
- **External APIs**: USDA and Open Food Facts for global food data
- **Open Source**: Built with amazing open-source technologies

## 📞 **Support**

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Comprehensive guides and tutorials
- **Examples**: Sample data and use cases

---

**Built with ❤️ for the Indian nutrition community**

*Transform your health journey with AI-powered Indian nutrition tracking!*
