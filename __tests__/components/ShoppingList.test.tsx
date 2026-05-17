import { render, screen, fireEvent } from '@testing-library/react'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem } from '@/types'

const items: ShoppingItem[] = [
  { name: 'olive oil', amount: 2, unit: 'tbsp', category: 'Oils' },
  { name: 'garlic',    amount: 3, unit: 'clove', category: 'Vegetables' },
  { name: 'tomatoes',  amount: 4, unit: 'unit',  category: 'Vegetables' },
]

test('renders category headers', () => {
  render(<ShoppingList items={items} />)
  expect(screen.getByText('Oils')).toBeInTheDocument()
  expect(screen.getByText('Vegetables')).toBeInTheDocument()
})

test('renders ingredient names', () => {
  render(<ShoppingList items={items} />)
  expect(screen.getByText(/olive oil/i)).toBeInTheDocument()
  expect(screen.getByText(/garlic/i)).toBeInTheDocument()
})

test('clicking an item marks it checked', () => {
  render(<ShoppingList items={items} />)
  const checkbox = screen.getAllByRole('checkbox')[0]
  expect(checkbox).not.toBeChecked()
  fireEvent.click(checkbox)
  expect(checkbox).toBeChecked()
})
