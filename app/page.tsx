import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let recentPlans: Array<{ id: string; cuisine_type: string; num_meals: number; created_at: string }> = []

  if (user) {
    const { data } = await supabase
      .from('meal_plans')
      .select('id, cuisine_type, num_meals, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    recentPlans = data ?? []
  }

  return (
    <main className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-2">What&apos;s for Dinner?</h1>
        <p className="text-gray-500 mb-8">
          Pick your cuisine, approve your meals, get your shopping list.
        </p>

        {user ? (
          <>
            <Link
              href="/plan/new"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors mb-4"
            >
              Start a new meal plan →
            </Link>
            <Link
              href="/profile"
              className="block text-sm text-gray-400 hover:text-orange-500 transition-colors mb-6"
            >
              View your profile
            </Link>

            {recentPlans.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm text-left">
                <h2 className="font-semibold text-gray-700 mb-3 text-sm">Recent plans</h2>
                <ul className="space-y-2">
                  {recentPlans.map(plan => (
                    <li key={plan.id}>
                      <Link
                        href={`/plan/${plan.id}/shopping-list`}
                        className="flex items-center justify-between py-1.5 text-sm hover:text-orange-500 transition-colors"
                      >
                        <span className="capitalize">{plan.cuisine_type} · {plan.num_meals} meals</span>
                        <span className="text-xs text-gray-400">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <Link
            href="/login"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Get started →
          </Link>
        )}
      </div>
    </main>
  )
}
