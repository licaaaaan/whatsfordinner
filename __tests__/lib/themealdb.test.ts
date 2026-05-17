import { pickMeals } from '@/lib/themealdb'
import type { TheMealDBMeal } from '@/types'

const meals: TheMealDBMeal[] = [
  { idMeal: '1', strMeal: 'Pasta Carbonara', strMealThumb: 'https://img/1.jpg' },
  { idMeal: '2', strMeal: 'Tacos al Pastor',  strMealThumb: 'https://img/2.jpg' },
  { idMeal: '3', strMeal: 'Margherita Pizza', strMealThumb: 'https://img/3.jpg' },
  { idMeal: '4', strMeal: 'Risotto',           strMealThumb: 'https://img/4.jpg' },
]

test('pickMeals excludes disliked recipe IDs', () => {
  const picked = pickMeals(meals, 4, ['2'])
  expect(picked.every(m => m.idMeal !== '2')).toBe(true)
})

test('pickMeals returns at most count meals', () => {
  const picked = pickMeals(meals, 2, [])
  expect(picked.length).toBeLessThanOrEqual(2)
})

test('pickMeals returns all meals when count exceeds available', () => {
  const picked = pickMeals(meals, 10, [])
  expect(picked.length).toBe(4)
})

test('pickMeals returns empty array when all meals are disliked', () => {
  const picked = pickMeals(meals, 3, ['1', '2', '3', '4'])
  expect(picked).toEqual([])
})
