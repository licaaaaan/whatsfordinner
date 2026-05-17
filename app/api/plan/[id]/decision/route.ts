import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTasteProfile } from '@/lib/taste-profile'
import type { TasteProfile } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, decision } = await request.json() as {
    itemId: string
    decision: 'approved' | 'skipped'
  }

  if (!itemId || !['approved', 'skipped'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Update the item status
  const { data: item, error: itemError } = await supabase
    .from('meal_plan_items')
    .update({ status: decision })
    .eq('id', itemId)
    .eq('meal_plan_id', planId)
    .select('recipe_id')
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Fetch the plan's cuisine type
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('cuisine_type')
    .eq('id', planId)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Upsert taste profile
  const { data: existingProfile } = await supabase
    .from('taste_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const baseProfile: TasteProfile = existingProfile ?? {
    id: '',
    user_id: user.id,
    cuisine_scores: {},
    liked_recipe_ids: [],
    disliked_recipe_ids: [],
  }

  const profileUpdate = updateTasteProfile(
    baseProfile,
    plan.cuisine_type,
    item.recipe_id,
    decision
  )

  await supabase.from('taste_profiles').upsert(
    { user_id: user.id, ...profileUpdate },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true })
}
