import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchIngredients, mergeIngredients } from '@/lib/edamam'

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

  // Fetch plan to get num_people
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('num_people')
    .eq('id', planId)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Fetch approved items
  const { data: approvedItems } = await supabase
    .from('meal_plan_items')
    .select('recipe_title')
    .eq('meal_plan_id', planId)
    .eq('status', 'approved')

  if (!approvedItems || approvedItems.length === 0) {
    return NextResponse.json({ error: 'No approved meals' }, { status: 400 })
  }

  // Call Edamam for each approved meal
  const ingredientArrays = await Promise.all(
    approvedItems.map(item =>
      fetchIngredients(item.recipe_title, plan.num_people)
    )
  )

  const items = mergeIngredients(ingredientArrays)

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

  const { data } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('meal_plan_id', planId)
    .single()

  return NextResponse.json({ items: data?.items ?? [] })
}
