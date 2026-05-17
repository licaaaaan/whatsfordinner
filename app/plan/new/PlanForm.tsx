'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlanForm({ areas }: { areas: string[] }) {
  const [numMeals, setNumMeals] = useState(5)
  const [numPeople, setNumPeople] = useState(2)
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
        num_people: numPeople,
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of people
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={numPeople}
            onChange={e => setNumPeople(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="text-center text-orange-600 font-bold text-lg mt-1">
            {numPeople} {numPeople === 1 ? 'person' : 'people'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuisine
          </label>
          <select
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="surprise">Surprise me!</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
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
