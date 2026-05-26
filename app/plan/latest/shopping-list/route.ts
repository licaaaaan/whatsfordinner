import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const base = new URL(request.url).origin

  if (!user) return NextResponse.redirect(`${base}/login`)

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!plan) return NextResponse.redirect(`${base}/`)

  return NextResponse.redirect(`${base}/plan/${plan.id}/shopping-list`)
}
