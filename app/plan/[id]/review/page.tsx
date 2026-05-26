'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import RecipeCard from '@/components/RecipeCard'
import type { MealPlanItem } from '@/types'

export default function ReviewPage() {
  const { id: planId } = useParams<{ id: string }>()
  const router = useRouter()
  const [items, setItems] = useState<MealPlanItem[]>([])
  const [numMeals, setNumMeals] = useState(5)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/plan/${planId}/items`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load recipes (${r.status})`)
        return r.json()
      })
      .then(data => {
        setItems(data.items ?? [])
        setNumMeals(data.numMeals ?? 5)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [planId])

  async function decide(decision: 'approved' | 'skipped') {
    if (deciding) return
    setDeciding(true)
    const item = items[currentIndex]

    try {
      const res = await fetch(`/api/plan/${planId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, decision }),
      })
      if (!res.ok) throw new Error(`Decision failed (${res.status})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeciding(false)
      return
    }

    const newApproved = approvedCount + (decision === 'approved' ? 1 : 0)
    if (decision === 'approved') setApprovedCount(newApproved)

    if (newApproved >= numMeals) {
      router.push(`/plan/${planId}/shopping-list`)
      return
    }

    if (currentIndex + 1 >= items.length) {
      setNoMore(true)
      setDeciding(false)
      return
    }

    setCurrentIndex(i => i + 1)
    setDeciding(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-xl mb-5" />
          <div className="h-6 bg-gray-200 rounded mb-3" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/plan/new')}
            className="bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold"
          >
            Start over
          </button>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            No recipes found for this cuisine. Try a different one!
          </p>
          <button
            onClick={() => router.push('/plan/new')}
            className="bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  if (noMore) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <p className="text-2xl mb-2">😕</p>
          <h2 className="text-lg font-bold text-gray-800 mb-2">No more dishes!</h2>
          <p className="text-gray-500 text-sm mb-6">
            You&apos;ve chosen {approvedCount} of {numMeals} meals.
            {approvedCount > 0
              ? ' Continue with what you have, or start over with a different cuisine.'
              : ' Try a different cuisine.'}
          </p>
          <div className="flex flex-col gap-3">
            {approvedCount > 0 && (
              <button
                onClick={() => router.push(`/plan/${planId}/shopping-list`)}
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold"
              >
                Continue with {approvedCount} meal{approvedCount !== 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => router.push('/plan/new')}
              className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
            >
              Start over
            </button>
          </div>
        </div>
      </main>
    )
  }

  const current = items[currentIndex]

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <RecipeCard
        title={current.recipe_title}
        image={current.recipe_image}
        current={approvedCount}
        total={numMeals}
        onKeep={() => decide('approved')}
        onSkip={() => decide('skipped')}
      />
    </main>
  )
}
