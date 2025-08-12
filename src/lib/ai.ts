// Enhanced AI helper using OpenRouter or Groq with comprehensive nutrition planning

type AIProvider = 'openrouter' | 'groq' | null;

const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const groqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

function getProvider(): AIProvider {
  if (openRouterKey) return 'openrouter';
  if (groqKey) return 'groq';
  return null;
}

// Enhanced meal planning interface
export interface MealPlanningContext {
  userProfile: {
    age: number;
    gender: 'male' | 'female';
    height: number; // cm
    weight: number; // kg
    bmi: number;
    goal: 'lose' | 'maintain' | 'gain';
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  };
  nutritionGoals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  preferences: {
    cuisine: 'indian' | 'international' | 'mixed';
    dietaryRestrictions: string[];
    favoriteFoods: string[];
    dislikedFoods: string[];
    mealTiming: {
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks: string[];
    };
  };
  currentMeals?: Array<{
    meal: string;
    foods: string[];
    calories: number;
  }>;
}

export async function generateMealIdeas(prompt: string): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    return 'Configure VITE_OPENROUTER_API_KEY or VITE_GROQ_API_KEY to enable AI meal ideas.';
  }

  try {
    if (provider === 'openrouter') {
      return await generateWithOpenRouter(prompt);
    }

    if (provider === 'groq') {
      return await generateWithGroq(prompt);
    }

    return 'AI provider not available.';
  } catch (err) {
    console.error('AI request failed', err);
    return 'AI request failed. Please try again later.';
  }
}

// Enhanced meal planning with comprehensive context
export async function generatePersonalizedMealPlan(context: MealPlanningContext): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    return 'Configure VITE_OPENROUTER_API_KEY or VITE_GROQ_API_KEY to enable AI meal planning.';
  }

  try {
    const prompt = buildComprehensiveMealPlanPrompt(context);
    
    if (provider === 'openrouter') {
      return await generateWithOpenRouter(prompt);
    }

    if (provider === 'groq') {
      return await generateWithGroq(prompt);
    }

    return 'AI provider not available.';
  } catch (err) {
    console.error('AI meal planning failed', err);
    return 'AI meal planning failed. Please try again later.';
  }
}

// Build comprehensive meal plan prompt
function buildComprehensiveMealPlanPrompt(context: MealPlanningContext): string {
  const { userProfile, nutritionGoals, preferences } = context;
  
  return `Create a personalized 7-day Indian meal plan for someone with these specifications:

**Personal Profile:**
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm
- Weight: ${userProfile.weight} kg
- BMI: ${userProfile.bmi}
- Goal: ${userProfile.goal} weight
- Activity Level: ${userProfile.activityLevel}

**Daily Nutrition Targets:**
- Calories: ${nutritionGoals.kcal} kcal
- Protein: ${nutritionGoals.protein}g
- Carbs: ${nutritionGoals.carbs}g
- Fat: ${nutritionGoals.fat}g

**Preferences:**
- Cuisine: ${preferences.cuisine}
- Dietary Restrictions: ${preferences.dietaryRestrictions.join(', ') || 'None'}
- Favorite Foods: ${preferences.favoriteFoods.join(', ') || 'None'}
- Disliked Foods: ${preferences.dislikedFoods.join(', ') || 'None'}

**Requirements:**
1. Focus on ${preferences.cuisine === 'indian' ? 'authentic Indian cuisine' : 'Indian and international options'}
2. Include breakfast, lunch, dinner, and 1-2 snacks per day
3. Consider BMI and weight goals for portion sizes
4. Provide specific food items with approximate portions in grams
5. Include traditional Indian foods like dal, roti, rice, vegetables
6. Suggest seasonal and locally available ingredients
7. Consider meal timing preferences
8. Provide nutritional breakdown for each meal
9. Include cooking tips and alternatives

**Format:**
- Day 1: [Meal] - [Foods with portions] - [Calories]
- Include variety and balance
- Consider Indian meal structure (dal-chawal, roti-sabzi, etc.)

Make it practical, culturally appropriate, and nutritionally balanced.`;
}

// Generate with OpenRouter
async function generateWithOpenRouter(prompt: string): Promise<string> {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        'X-Title': 'WellnessDash',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian nutritionist and chef with deep knowledge of:
- Traditional Indian cuisine and cooking methods
- Nutritional science and meal planning
- Indian food culture and regional variations
- Healthy cooking techniques and ingredient substitutions

Provide practical, culturally appropriate meal plans with:
- Specific food items and portions in grams
- Nutritional information
- Cooking tips and alternatives
- Consideration for Indian dietary preferences and availability

Keep responses structured, informative, and actionable.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OpenRouter error', resp.status, errText);
      
      // Provide more specific error messages
      if (resp.status === 401) {
        return 'AI service authentication failed. Please check your API key configuration.';
      } else if (resp.status === 429) {
        return 'AI service rate limit exceeded. Please try again in a few minutes.';
      } else if (resp.status >= 500) {
        return 'AI service temporarily unavailable. Please try again later.';
      } else {
        return `AI request failed (${resp.status}). Please try again.`;
      }
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || 'No response received from AI service.';
  } catch (error) {
    console.error('OpenRouter request failed:', error);
    return 'AI service connection failed. Please check your internet connection and try again.';
  }
}

// Generate with Groq
async function generateWithGroq(prompt: string): Promise<string> {
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian nutritionist and chef. Provide practical, culturally appropriate meal plans with specific portions and nutritional information.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn('Groq not OK (likely CORS in browser):', resp.status, errText);
      return 'AI request failed (Groq). Use OpenRouter in browser or call Groq server-side.';
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || 'No response received from AI service.';
  } catch (error) {
    console.error('Groq request failed:', error);
    return 'AI service connection failed. Please try again.';
  }
}

// Helper function to calculate BMI
export function calculateBMI(height: number, weight: number): number {
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

// Helper function to get activity level multiplier
export function getActivityMultiplier(activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };
  return multipliers[activityLevel as keyof typeof multipliers] || 1.2;
}

// Helper function to calculate BMR using Mifflin-St Jeor Equation
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Helper function to calculate daily calorie needs
export function calculateDailyCalories(bmr: number, activityLevel: string, goal: 'lose' | 'maintain' | 'gain'): number {
  const tdee = bmr * getActivityMultiplier(activityLevel);
  
  switch (goal) {
    case 'lose':
      return Math.round(tdee * 0.85); // 15% deficit
    case 'gain':
      return Math.round(tdee * 1.1); // 10% surplus
    default:
      return Math.round(tdee); // maintain
  }
}
