import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { ingredients, targetCalories, targetProtein, targetCarbs, targetFat } = await req.json();
    if (!ingredients) return NextResponse.json({ error: "Missing ingredients" }, { status: 400 });

    // 1. Get the primary ingredient (just taking the first word or item before a comma)
    const primaryIngredient = ingredients.split(",")[0].trim().replace(/\s+/g, "_");

    // 2. Fetch meals from TheMealDB by primary ingredient
    const filterRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryIngredient}`);
    const filterData = await filterRes.json();

    if (!filterData.meals) {
      return NextResponse.json({ suggestions: [] });
    }

    // 3. Take up to 3 random meals
    const shuffled = filterData.meals.sort(() => 0.5 - Math.random());
    const selectedMeals = shuffled.slice(0, 3);

    // 4. Fetch full details for these meals
    const fullMeals = await Promise.all(selectedMeals.map(async (m: any) => {
      const lookupRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
      const lookupData = await lookupRes.json();
      return lookupData.meals[0];
    }));

    // 5. Ask OpenRouter to estimate macros for each meal
    const mealsPromptData = fullMeals.map((m: any) => {
      // Extract ingredients and measures
      const recipeIngredients = [];
      for (let i = 1; i <= 20; i++) {
        if (m[`strIngredient${i}`]) {
          recipeIngredients.push(`${m[`strMeasure${i}`]} ${m[`strIngredient${i}`]}`);
        }
      }
      return {
        id: m.idMeal,
        name: m.strMeal,
        image: m.strMealThumb,
        instructions: m.strInstructions,
        ingredients: recipeIngredients,
        source: m.strSource || m.strYoutube
      };
    });

    const prompt = `You are an expert nutritionist. I have a list of meals with their ingredients.
For each meal, estimate its total macros (Calories, Protein, Carbs, Fat).
The user is aiming to hit these remaining targets for the day:
Calories: ${targetCalories}
Protein: ${targetProtein}g
Carbs: ${targetCarbs}g
Fat: ${targetFat}g

Here are the meals:
${JSON.stringify(mealsPromptData, null, 2)}

Return a JSON object containing an array called "suggestions" with each meal ID and your estimated macros. Structure:
{
  "suggestions": [
    {
      "id": "123",
      "calories": 500,
      "protein": 30,
      "carbs": 40,
      "fat": 15,
      "matchScore": 85, // 0-100 how well it fits the user's remaining goals
      "matchReason": "Short sentence explaining why it fits"
    }
  ]
}
Return ONLY the raw JSON object.`;

    const aiResult = await callOpenRouter(prompt, "You are a helpful nutritionist.", {
      model: AGENTS.MEMORY_MANAGER,
      temperature: 0.1,
      jsonMode: true
    });

    const jsonStr = aiResult.replace(/```json/g, "").replace(/```/g, "").trim();
    const macrosData = JSON.parse(jsonStr);

    // 6. Merge the AI data with the MealDB data
    const finalSuggestions = mealsPromptData.map((m: any) => {
      const macroMatch = macrosData.suggestions?.find((s: any) => s.id === m.id) || {
        calories: 0, protein: 0, carbs: 0, fat: 0, matchScore: 0, matchReason: "Could not estimate"
      };
      return {
        ...m,
        ...macroMatch
      };
    });

    // Sort by match score
    finalSuggestions.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({ suggestions: finalSuggestions });

  } catch (error) {
    console.error("Meal suggestions error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
