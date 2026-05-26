import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchMealsByArea,
  fetchMealsByCategory,
  fetchMealsBySearch,
  fetchRandomArea,
  pickMeals,
} from '@/lib/themealdb'
import type { TheMealDBMeal } from '@/types'

async function resolveCuisine(
  cuisine_type: string
): Promise<{ area: string; meals: TheMealDBMeal[] }> {
  if (cuisine_type === 'surprise') {
    const area = await fetchRandomArea()
    return { area, meals: await fetchMealsByArea(area) }
  }
  if (cuisine_type.startsWith('area:')) {
    const area = cuisine_type.slice(5)
    return { area, meals: await fetchMealsByArea(area) }
  }
  if (cuisine_type.startsWith('category:')) {
    const area = cuisine_type.slice(9)
    return { area, meals: await fetchMealsByCategory(area) }
  }
  if (cuisine_type.startsWith('search:')) {
    const area = cuisine_type.slice(7)
    return { area, meals: await fetchMealsBySearch(area) }
  }
  return { area: cuisine_type, meals: await fetchMealsByArea(cuisine_type) }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    num_meals: number
    cuisine_types: string[]
  }

  const { num_meals, cuisine_types } = body

  if (num_meals == null || !cuisine_types?.length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch meals for all selected cuisines in parallel, deduplicate by meal ID
  let results: { area: string; meals: TheMealDBMeal[] }[]
  try {
    results = await Promise.all(cuisine_types.map(resolveCuisine))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cuisine data' }, { status: 503 })
  }

  const mealMap = new Map<string, TheMealDBMeal>()
  for (const { meals } of results) {
    for (const meal of meals) mealMap.set(meal.idMeal, meal)
  }
  const allMeals = Array.from(mealMap.values())
  const cuisineLabel = results.map(r => r.area).join(', ')

  // Fetch user taste profile to exclude disliked recipes
  const { data: profileRow } = await supabase
    .from('taste_profiles')
    .select('disliked_recipe_ids')
    .eq('user_id', user.id)
    .single()

  const dislikedIds: string[] = profileRow?.disliked_recipe_ids ?? []

  // Pick a large pool so the user can keep skipping until they reach their goal
  const poolSize = Math.min(allMeals.length, Math.max(num_meals * 5, 20))
  const chosen = pickMeals(allMeals, poolSize, dislikedIds)

  // Create meal plan row
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({ user_id: user.id, num_meals, num_people: 2, cuisine_type: cuisineLabel })
    .select()
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }

  // Insert meal_plan_items
  const items = chosen.map((meal, i) => ({
    meal_plan_id: plan.id,
    recipe_id: meal.idMeal,
    recipe_title: meal.strMeal,
    recipe_image: meal.strMealThumb,
    display_order: i,
    status: 'pending',
  }))

  const { error: itemsError } = await supabase
    .from('meal_plan_items')
    .insert(items)

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to save items' }, { status: 500 })
  }

  return NextResponse.json({ planId: plan.id })
}
