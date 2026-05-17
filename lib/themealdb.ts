import type { TheMealDBMeal } from '@/types'

const BASE = 'https://www.themealdb.com/api/json/v1/1'

export async function fetchAreas(): Promise<string[]> {
  const res = await fetch(`${BASE}/list.php?a=list`)
  const data = await res.json()
  return (data.meals as { strArea: string }[]).map(m => m.strArea).sort()
}

export async function fetchMealsByArea(area: string): Promise<TheMealDBMeal[]> {
  const res = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`)
  const data = await res.json()
  return (data.meals as TheMealDBMeal[]) ?? []
}

export async function fetchRandomArea(): Promise<string> {
  const areas = await fetchAreas()
  return areas[Math.floor(Math.random() * areas.length)]
}

export function pickMeals(
  meals: TheMealDBMeal[],
  count: number,
  dislikedIds: string[]
): TheMealDBMeal[] {
  const eligible = meals.filter(m => !dislikedIds.includes(m.idMeal))
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
