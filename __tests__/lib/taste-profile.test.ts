import { updateTasteProfile, getTopCuisines } from '@/lib/taste-profile'
import type { TasteProfile } from '@/types'

const base: TasteProfile = {
  id: 'p1',
  user_id: 'u1',
  cuisine_scores: { italian: 3, mexican: 1 },
  liked_recipe_ids: [],
  disliked_recipe_ids: [],
}

test('approved meal increments cuisine score by 1', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'approved')
  expect(update.cuisine_scores!['italian']).toBe(4)
})

test('approved meal adds recipe to liked_recipe_ids', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'approved')
  expect(update.liked_recipe_ids).toContain('meal1')
})

test('approved meal does not duplicate liked_recipe_ids', () => {
  const profile = { ...base, liked_recipe_ids: ['meal1'] }
  const update = updateTasteProfile(profile, 'Italian', 'meal1', 'approved')
  expect(update.liked_recipe_ids!.filter(id => id === 'meal1').length).toBe(1)
})

test('skipped meal decrements cuisine score by 0.5', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'skipped')
  expect(update.cuisine_scores!['italian']).toBe(2.5)
})

test('skipped meal floors score at 0', () => {
  const profile = { ...base, cuisine_scores: { italian: 0.3 } }
  const update = updateTasteProfile(profile, 'Italian', 'meal1', 'skipped')
  expect(update.cuisine_scores!['italian']).toBe(0)
})

test('skipped meal adds recipe to disliked_recipe_ids', () => {
  const update = updateTasteProfile(base, 'Italian', 'meal1', 'skipped')
  expect(update.disliked_recipe_ids).toContain('meal1')
})

test('new cuisine initialises at 1 when approved', () => {
  const update = updateTasteProfile(base, 'Chinese', 'meal2', 'approved')
  expect(update.cuisine_scores!['chinese']).toBe(1)
})

test('getTopCuisines returns top N sorted descending', () => {
  const scores = { italian: 8, mexican: 3, chinese: 5 }
  const top = getTopCuisines(scores, 2)
  expect(top).toEqual([
    { cuisine: 'italian', score: 8 },
    { cuisine: 'chinese', score: 5 },
  ])
})

test('getTopCuisines returns all when limit exceeds entries', () => {
  const scores = { italian: 8 }
  const top = getTopCuisines(scores, 5)
  expect(top.length).toBe(1)
})
