import type { TasteProfile } from '@/types'

export function updateTasteProfile(
  profile: TasteProfile,
  cuisineType: string,
  recipeId: string,
  decision: 'approved' | 'skipped'
): Partial<TasteProfile> {
  const cuisine = cuisineType.toLowerCase()
  const scores = { ...profile.cuisine_scores }

  if (decision === 'approved') {
    scores[cuisine] = (scores[cuisine] ?? 0) + 1
    return {
      cuisine_scores: scores,
      liked_recipe_ids: [...new Set([...profile.liked_recipe_ids, recipeId])],
    }
  } else {
    scores[cuisine] = Math.max(0, (scores[cuisine] ?? 0) - 0.5)
    return {
      cuisine_scores: scores,
      disliked_recipe_ids: [...new Set([...profile.disliked_recipe_ids, recipeId])],
    }
  }
}

export function getTopCuisines(
  scores: Record<string, number>,
  limit = 5
): Array<{ cuisine: string; score: number }> {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([cuisine, score]) => ({ cuisine, score }))
}
