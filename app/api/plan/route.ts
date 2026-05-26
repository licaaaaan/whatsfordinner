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

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    num_meals: number
    cuisine_type: string
  }

  const { num_meals, cuisine_type } = body

  if (num_meals == null || !cuisine_type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Resolve cuisine and fetch all candidate meals
  let area: string
  let allMeals: TheMealDBMeal[]
  try {
    if (cuisine_type === 'surprise') {
      area = await fetchRandomArea()
      allMeals = await fetchMealsByArea(area)
    } else if (cuisine_type.startsWith('area:')) {
      area = cuisine_type.slice(5)
      allMeals = await fetchMealsByArea(area)
    } else if (cuisine_type.startsWith('category:')) {
      area = cuisine_type.slice(9)
      allMeals = await fetchMealsByCategory(area)
    } else if (cuisine_type.startsWith('search:')) {
      area = cuisine_type.slice(7)
      allMeals = await fetchMealsBySearch(area)
    } else {
      area = cuisine_type
      allMeals = await fetchMealsByArea(area)
    }
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cuisine data' }, { status: 503 })
  }

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

  // Create meal plan row (num_people defaults to 2 for ingredient scaling)
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({ user_id: user.id, num_meals, num_people: 2, cuisine_type: area })
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
