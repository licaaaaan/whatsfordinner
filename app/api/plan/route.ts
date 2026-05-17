import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMealsByArea, fetchRandomArea, pickMeals } from '@/lib/themealdb'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    num_meals: number
    num_people: number
    cuisine_type: string
  }

  const { num_meals, num_people, cuisine_type } = body

  if (!num_meals || !num_people || !cuisine_type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Resolve cuisine area (random if "surprise")
  const area =
    cuisine_type === 'surprise' ? await fetchRandomArea() : cuisine_type

  // Fetch user taste profile to exclude disliked recipes
  const { data: profileRow } = await supabase
    .from('taste_profiles')
    .select('disliked_recipe_ids')
    .eq('user_id', user.id)
    .single()

  const dislikedIds: string[] = profileRow?.disliked_recipe_ids ?? []

  // Fetch recipes from TheMealDB and pick
  const allMeals = await fetchMealsByArea(area)
  const chosen = pickMeals(allMeals, num_meals, dislikedIds)

  // Create meal plan row
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({ user_id: user.id, num_meals, num_people, cuisine_type: area })
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
