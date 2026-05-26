'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CUISINE_OPTIONS = [
  { label: 'Surprise me!', value: 'surprise' },
  { label: 'Chinese', value: 'area:Chinese' },
  { label: 'Korean', value: 'area:Korean' },
  { label: 'Japanese', value: 'area:Japanese' },
  { label: 'Italian', value: 'area:Italian' },
  { label: 'Mexican', value: 'area:Mexican' },
  { label: 'Indian', value: 'area:Indian' },
  { label: 'Thai', value: 'area:Thai' },
  { label: 'French', value: 'area:French' },
  { label: 'Greek', value: 'area:Greek' },
  { label: 'Pizza', value: 'search:pizza' },
  { label: 'Pasta', value: 'category:Pasta' },
  { label: 'Curry', value: 'search:curry' },
  { label: 'Seafood', value: 'category:Seafood' },
]

export default function PlanForm() {
  const [numMeals, setNumMeals] = useState(5)
  const [cuisine, setCuisine] = useState('surprise')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        num_meals: numMeals,
        cuisine_type: cuisine,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setLoading(false)
      router.push(`/plan/${data.planId}/review`)
    } else {
      alert(data.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-orange-600 mb-1">Plan your week</h1>
      <p className="text-gray-500 text-sm mb-6">Tell us what you&apos;re in the mood for.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of meals
          </label>
          <input
            type="range"
            min={1}
            max={7}
            value={numMeals}
            onChange={e => setNumMeals(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="text-center text-orange-600 font-bold text-lg mt-1">
            {numMeals} meal{numMeals !== 1 ? 's' : ''}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cuisine
          </label>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCuisine(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  cuisine === opt.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate my meal plan →'}
        </button>
      </form>
    </div>
  )
}
