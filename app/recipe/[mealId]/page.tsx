import { fetchMealDetail } from '@/lib/themealdb'
import { notFound } from 'next/navigation'
import BackButton from '@/components/BackButton'

export default async function RecipePage({ params }: { params: Promise<{ mealId: string }> }) {
  const { mealId } = await params
  const meal = await fetchMealDetail(mealId)

  if (!meal) notFound()

  const steps = meal.strInstructions
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  return (
    <main className="min-h-screen bg-orange-50 pb-4">
      <div className="max-w-md mx-auto">
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={meal.strMealThumb} alt={meal.strMeal} className="w-full h-full object-cover" />
          <BackButton />
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{meal.strMeal}</h1>
            {(meal.strArea || meal.strCategory) && (
              <p className="text-sm text-gray-400 mt-0.5">
                {[meal.strArea, meal.strCategory].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">Ingredients</h2>
            <ul className="space-y-1.5">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{ing.name}</span>
                  <span className="text-gray-400">{ing.measure}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">Instructions</h2>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">{step}</p>
              ))}
            </div>
          </div>

          {meal.strYoutube && (
            <a
              href={meal.strYoutube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch on YouTube
            </a>
          )}
        </div>
      </div>
    </main>
  )
}
