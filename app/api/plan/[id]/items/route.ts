import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data: items, error } = await supabase
    .from('meal_plan_items')
    .select('*')
    .eq('meal_plan_id', planId)
    .order('display_order')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('num_meals')
    .eq('id', planId)
    .single()

  return NextResponse.json({ items: items ?? [], numMeals: plan?.num_meals ?? 5 })
}
