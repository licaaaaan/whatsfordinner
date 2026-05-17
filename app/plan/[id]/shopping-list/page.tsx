'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem } from '@/types'

export default function ShoppingListPage() {
  const { id: planId } = useParams<{ id: string }>()
  const router = useRouter()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch(`/api/plan/${planId}/shopping-list`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) {
          setItems(data.items)
          setLoading(false)
        } else {
          setGenerating(true)
          return fetch(`/api/plan/${planId}/shopping-list`, { method: 'POST' })
            .then(r => r.json())
            .then(d => {
              setItems(d.items ?? [])
              setLoading(false)
              setGenerating(false)
            })
        }
      })
  }, [planId])

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🛒</div>
          <p className="text-gray-500">
            {generating ? 'Building your shopping list…' : 'Loading…'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-600">Shopping List</h1>
          <span className="text-sm text-gray-400">{items.length} items</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="mb-2">No approved meals — nothing to buy!</p>
            <p className="text-sm">Go back and approve at least one meal.</p>
          </div>
        ) : (
          <ShoppingList items={items} />
        )}

        <button
          onClick={() => router.push('/plan/new')}
          className="mt-8 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          Plan another week →
        </button>
      </div>
    </main>
  )
}
