import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('taste_profiles')
    .select('cuisine_scores, liked_recipe_ids')
    .eq('user_id', user.id)
    .single()

  const { count: totalPlans } = await supabase
    .from('meal_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: recentPlans } = await supabase
    .from('meal_plans')
    .select('id, cuisine_type, num_meals, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    cuisine_scores: profile?.cuisine_scores ?? {},
    total_recipes_liked: profile?.liked_recipe_ids?.length ?? 0,
    total_plans: totalPlans ?? 0,
    recent_plans: recentPlans ?? [],
  })
}
