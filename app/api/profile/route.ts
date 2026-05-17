import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('taste_profiles')
    .select('cuisine_scores, liked_recipe_ids')
    .eq('user_id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const { count: totalPlans, error: countError } = await supabase
    .from('meal_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const { data: recentPlans, error: plansError } = await supabase
    .from('meal_plans')
    .select('id, cuisine_type, num_meals, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (plansError) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({
    cuisine_scores: profile?.cuisine_scores ?? {},
    total_recipes_liked: profile?.liked_recipe_ids?.length ?? 0,
    total_plans: totalPlans ?? 0,
    recent_plans: recentPlans ?? [],
  })
}
