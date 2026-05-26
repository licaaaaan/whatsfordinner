import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMealIngredients, mergeShoppingIngredients } from '@/lib/themealdb'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ownership check
  const { data: planCheck } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!planCheck) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Fetch approved items (need recipe_id for TheMealDB lookup)
  const { data: approvedItems } = await supabase
    .from('meal_plan_items')
    .select('recipe_id, recipe_title')
    .eq('meal_plan_id', planId)
    .eq('status', 'approved')

  if (!approvedItems || approvedItems.length === 0) {
    return NextResponse.json({ error: 'No approved meals' }, { status: 400 })
  }

  // Fetch ingredients from TheMealDB for each approved meal
  let ingredientArrays
  try {
    ingredientArrays = await Promise.all(
      approvedItems.map(item => fetchMealIngredients(item.recipe_id))
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ingredient data' }, { status: 502 })
  }

  const items = mergeShoppingIngredients(ingredientArrays)

  // Upsert shopping list
  const { error: upsertError } = await supabase
    .from('shopping_lists')
    .upsert({ meal_plan_id: planId, items })

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save shopping list' }, { status: 500 })
  }

  return NextResponse.json({ items })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify plan belongs to user before returning shopping list
  const { data: planCheck } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!planCheck) {
    return NextResponse.json({ items: [] })
  }

  const { data } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('meal_plan_id', planId)
    .single()

  return NextResponse.json({ items: data?.items ?? [] })
}
