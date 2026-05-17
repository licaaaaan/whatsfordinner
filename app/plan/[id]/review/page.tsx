'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import RecipeCard from '@/components/RecipeCard'
import type { MealPlanItem } from '@/types'

export default function ReviewPage() {
  const { id: planId } = useParams<{ id: string }>()
  const router = useRouter()
  const [items, setItems] = useState<MealPlanItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)

  useEffect(() => {
    fetch(`/api/plan/${planId}/items`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
        setLoading(false)
      })
  }, [planId])

  async function decide(decision: 'approved' | 'skipped') {
    if (deciding) return
    setDeciding(true)
    const item = items[currentIndex]

    await fetch(`/api/plan/${planId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, decision }),
    })

    if (currentIndex + 1 >= items.length) {
      router.push(`/plan/${planId}/shopping-list`)
    } else {
      setCurrentIndex(i => i + 1)
      setDeciding(false)
    }
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

  const current = items[currentIndex]

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <RecipeCard
        title={current.recipe_title}
        image={current.recipe_image}
        current={currentIndex + 1}
        total={items.length}
        onKeep={() => decide('approved')}
        onSkip={() => decide('skipped')}
      />
    </main>
  )
}
