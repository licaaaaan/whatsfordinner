import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

type Meal = {
  recipe_id: string
  recipe_title: string
  recipe_image: string | null
}

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, cuisine_type, num_meals, created_at')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) notFound()

  const { data: items } = await supabase
    .from('meal_plan_items')
    .select('recipe_id, recipe_title, recipe_image')
    .eq('meal_plan_id', planId)
    .eq('status', 'approved')
    .order('display_order')

  const meals: Meal[] = items ?? []

  return (
    <main className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">←</Link>
          <div>
            <h1 className="text-xl font-bold text-orange-600 capitalize">{plan.cuisine_type}</h1>
            <p className="text-sm text-gray-400">
              {meals.length} approved meal{meals.length !== 1 ? 's' : ''}
              {' · '}
              {new Date(plan.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {meals.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="mb-4">No approved meals yet.</p>
            <Link href={`/plan/${planId}/review`} className="text-orange-500 font-medium hover:text-orange-600">
              Review meals →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 mb-6">
            {meals.map(meal => (
              <li key={meal.recipe_id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex items-center gap-3 p-3">
                {meal.recipe_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meal.recipe_image}
                    alt={meal.recipe_title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <span className="flex-1 font-medium text-gray-800 text-sm">{meal.recipe_title}</span>
                <Link
                  href={`/recipe/${meal.recipe_id}`}
                  className="text-sm text-orange-500 font-medium hover:text-orange-600 flex-shrink-0 transition-colors"
                >
                  Recipe →
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/plan/${planId}/shopping-list`}
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-center transition-colors"
        >
          View shopping list →
        </Link>
      </div>
    </main>
  )
}
