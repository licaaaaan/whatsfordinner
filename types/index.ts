export type MealPlan = {
  id: string
  user_id: string
  num_meals: number
  num_people: number
  cuisine_type: string
  created_at: string
}

export type MealPlanItem = {
  id: string
  meal_plan_id: string
  recipe_id: string
  recipe_title: string
  recipe_image: string
  display_order: number
  status: 'pending' | 'approved' | 'skipped'
}

export type ShoppingItem = {
  name: string
  amount: number
  unit: string
  category: string
}

export type ShoppingList = {
  id: string
  meal_plan_id: string
  items: ShoppingItem[]
  created_at: string
}

export type TasteProfile = {
  id: string
  user_id: string
  cuisine_scores: Record<string, number>
  liked_recipe_ids: string[]
  disliked_recipe_ids: string[]
}

export type TheMealDBMeal = {
  idMeal: string
  strMeal: string
  strMealThumb: string
}
