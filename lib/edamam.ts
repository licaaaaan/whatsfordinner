import type { ShoppingItem } from '@/types'

export type EdamamIngredient = {
  food: string
  quantity: number
  measure: string | null
  foodCategory: string
}

const BASE = 'https://api.edamam.com/api/recipes/v2'

export async function fetchIngredients(
  recipeTitle: string,
  numPeople: number
): Promise<EdamamIngredient[]> {
  const appId = process.env.EDAMAM_APP_ID
  const appKey = process.env.EDAMAM_APP_KEY

  const url = new URL(BASE)
  url.searchParams.set('type', 'public')
  url.searchParams.set('q', recipeTitle)
  url.searchParams.set('app_id', appId!)
  url.searchParams.set('app_key', appKey!)

  const res = await fetch(url.toString())

  if (res.status === 401 || res.status === 429) {
    return []
  }

  const data = await res.json()
  const hit = data.hits?.[0]
  if (!hit) return []

  const recipe = hit.recipe
  const servings: number = recipe.yield ?? 4
  const scale = numPeople / servings

  return (recipe.ingredients ?? []).map((ing: Record<string, unknown>) => ({
    food: ing.food as string,
    quantity: Math.round(((ing.quantity as number) ?? 1) * scale * 10) / 10,
    measure: (ing.measure as string | null) ?? null,
    foodCategory: (ing.foodCategory as string) ?? 'Other',
  }))
}

export function mergeIngredients(
  allIngredients: EdamamIngredient[][]
): ShoppingItem[] {
  const merged: Record<string, ShoppingItem> = {}

  for (const ingredients of allIngredients) {
    for (const ing of ingredients) {
      const key = `${ing.food}__${ing.measure ?? 'unit'}__${ing.foodCategory}`
      if (merged[key]) {
        merged[key].amount =
          Math.round((merged[key].amount + ing.quantity) * 10) / 10
      } else {
        merged[key] = {
          name: ing.food,
          amount: ing.quantity,
          unit: ing.measure ?? 'unit',
          category: ing.foodCategory,
        }
      }
    }
  }

  return Object.values(merged).sort((a, b) =>
    a.category.localeCompare(b.category)
  )
}
