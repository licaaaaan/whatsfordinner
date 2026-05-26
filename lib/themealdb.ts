import type { TheMealDBMeal, ShoppingItem } from '@/types'

const BASE = 'https://www.themealdb.com/api/json/v1/1'

type MealIngredient = { name: string; amount: number; unit: string }

function parseMeasure(raw: string): { amount: number; unit: string } {
  if (!raw) return { amount: 1, unit: '' }
  const match = raw.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(.*)$/)
  if (!match) return { amount: 1, unit: raw }
  const [, numStr, unit] = match
  let amount = parseFloat(numStr)
  if (numStr.includes('/')) {
    const [a, b] = numStr.split('/')
    amount = parseFloat(a) / parseFloat(b)
  }
  return { amount: isNaN(amount) ? 1 : Math.round(amount * 10) / 10, unit: unit.trim() }
}

export async function fetchMealIngredients(idMeal: string): Promise<MealIngredient[]> {
  const res = await fetch(`${BASE}/lookup.php?i=${encodeURIComponent(idMeal)}`)
  if (!res.ok) return []
  const data = await res.json()
  const meal = data.meals?.[0]
  if (!meal) return []

  const ingredients: MealIngredient[] = []
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] as string | null)?.trim()
    if (!name) continue
    const rawMeasure = (meal[`strMeasure${i}`] as string | null)?.trim() ?? ''
    const { amount, unit } = parseMeasure(rawMeasure)
    ingredients.push({ name, amount, unit })
  }
  return ingredients
}

export function mergeShoppingIngredients(
  allIngredients: MealIngredient[][]
): ShoppingItem[] {
  const merged: Record<string, ShoppingItem> = {}
  for (const ingredients of allIngredients) {
    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}`
      if (merged[key]) {
        merged[key].amount = Math.round((merged[key].amount + ing.amount) * 10) / 10
      } else {
        merged[key] = { name: ing.name, amount: ing.amount, unit: ing.unit, category: 'Ingredients' }
      }
    }
  }
  return Object.values(merged).sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchAreas(): Promise<string[]> {
  const res = await fetch(`${BASE}/list.php?a=list`)
  const data = await res.json()
  return (data.meals as { strArea: string }[]).map(m => m.strArea).sort()
}

export async function fetchMealsByArea(area: string): Promise<TheMealDBMeal[]> {
  const res = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.meals as TheMealDBMeal[]) ?? []
}

export async function fetchMealsByCategory(category: string): Promise<TheMealDBMeal[]> {
  const res = await fetch(`${BASE}/filter.php?c=${encodeURIComponent(category)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.meals as TheMealDBMeal[]) ?? []
}

export async function fetchMealsBySearch(query: string): Promise<TheMealDBMeal[]> {
  const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`)
  if (!res.ok) return []
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
