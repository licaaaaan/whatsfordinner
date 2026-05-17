import { mergeIngredients } from '@/lib/edamam'
import type { EdamamIngredient } from '@/lib/edamam'

const oil: EdamamIngredient = { food: 'olive oil', quantity: 1, measure: 'tbsp', foodCategory: 'Oils' }
const garlic: EdamamIngredient = { food: 'garlic', quantity: 2, measure: 'clove', foodCategory: 'Vegetables' }
const moreOil: EdamamIngredient = { food: 'olive oil', quantity: 2, measure: 'tbsp', foodCategory: 'Oils' }

test('mergeIngredients sums same ingredient across recipes', () => {
  const result = mergeIngredients([[oil], [moreOil]])
  const found = result.find(i => i.name === 'olive oil')
  expect(found?.amount).toBe(3)
})

test('mergeIngredients keeps distinct ingredients separate', () => {
  const result = mergeIngredients([[oil], [garlic]])
  expect(result.length).toBe(2)
})

test('mergeIngredients returns empty array for empty input', () => {
  expect(mergeIngredients([])).toEqual([])
})

test('mergeIngredients sorts by category', () => {
  const result = mergeIngredients([[oil, garlic]])
  expect(result[0].category).toBe('Oils')
  expect(result[1].category).toBe('Vegetables')
})
