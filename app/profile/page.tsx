'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CuisineChart from '@/components/CuisineChart'
import { createClient } from '@/lib/supabase/client'

type ProfileData = {
  cuisine_scores: Record<string, number>
  total_recipes_liked: number
  total_plans: number
  recent_plans: Array<{ id: string; cuisine_type: string; num_meals: number; created_at: string }>
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load profile (${r.status})`)
        return r.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (error) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <p className="text-red-500">{error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-600">Your Profile</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{data.total_plans}</div>
            <div className="text-xs text-gray-400 mt-1">Meals planned</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{data.total_recipes_liked}</div>
            <div className="text-xs text-gray-400 mt-1">Recipes kept</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Top cuisines</h2>
          <CuisineChart scores={data.cuisine_scores} />
        </div>

        {data.recent_plans.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">Recent plans</h2>
            <ul className="space-y-2">
              {data.recent_plans.map(plan => (
                <li key={plan.id}>
                  <button
                    onClick={() => router.push(`/plan/${plan.id}/shopping-list`)}
                    className="w-full text-left flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-orange-500 transition-colors"
                  >
                    <span className="text-sm capitalize">{plan.cuisine_type} · {plan.num_meals} meals</span>
                    <span className="text-xs text-gray-400">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
