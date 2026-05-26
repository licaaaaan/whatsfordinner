import type { TheMealDBMeal, ShoppingItem } from '@/types'

const BASE = 'https://www.themealdb.com/api/json/v1/1'

type MealIngredient = { name: string; amount: number; unit: string }

const DESCRIPTOR_WORDS = new Set([
  // preparation state
  'raw', 'frozen', 'fresh', 'dried', 'cooked', 'smoked', 'canned', 'tinned', 'pickled',
  'boiled', 'fried', 'roasted', 'baked', 'grilled',
  // cut / form
  'chopped', 'sliced', 'diced', 'minced', 'crushed', 'grated', 'shredded', 'ground',
  'mashed', 'peeled',
  // size / quality
  'large', 'small', 'medium', 'thick', 'thin', 'whole', 'half',
  'jumbo', 'giant', 'king', 'queen', 'baby', 'lean', 'boneless', 'skinless',
  // plant parts used as form words
  'leaves', 'leaf', 'stalks', 'stalk', 'stems', 'stem',
  'sprigs', 'sprig', 'florets', 'floret',
  // generic piece words
  'pieces', 'piece', 'slices', 'slice', 'chunks', 'chunk',
  'strips', 'strip', 'cubes', 'cube', 'fillets', 'fillet',
])

function normalizeIngredientName(name: string): string {
  const words = name.toLowerCase().trim().split(/\s+/)
  const filtered = words.filter(w => !DESCRIPTOR_WORDS.has(w))
  return (filtered.length > 0 ? filtered : words).join(' ')
}

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
      const key = normalizeIngredientName(ing.name)
      const displayName = key.charAt(0).toUpperCase() + key.slice(1)
      if (merged[key]) {
        if (merged[key].unit === ing.unit) {
          merged[key].amount = Math.round((merged[key].amount + ing.amount) * 10) / 10
        }
        // same ingredient, different unit — keep first entry, skip duplicate
      } else {
        merged[key] = { name: displayName, amount: ing.amount, unit: ing.unit, category: 'Ingredients' }
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

export type MealDetail = {
  idMeal: string
  strMeal: string
  strMealThumb: string
  strInstructions: string
  strYoutube: string | null
  strArea: string | null
  strCategory: string | null
  ingredients: { name: string; measure: string }[]
}

export async function fetchMealDetail(idMeal: string): Promise<MealDetail | null> {
  const res = await fetch(`${BASE}/lookup.php?i=${encodeURIComponent(idMeal)}`)
  if (!res.ok) return null
  const data = await res.json()
  const meal = data.meals?.[0]
  if (!meal) return null

  const ingredients: { name: string; measure: string }[] = []
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] as string | null)?.trim()
    if (!name) continue
    const measure = (meal[`strMeasure${i}`] as string | null)?.trim() ?? ''
    ingredients.push({ name, measure })
  }

  return {
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb,
    strInstructions: meal.strInstructions ?? '',
    strYoutube: meal.strYoutube || null,
    strArea: meal.strArea || null,
    strCategory: meal.strCategory || null,
    ingredients,
  }
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
