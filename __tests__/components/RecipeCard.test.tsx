import { render, screen, fireEvent } from '@testing-library/react'
import RecipeCard from '@/components/RecipeCard'

const props = {
  title: 'Pasta Carbonara',
  image: 'https://img/pasta.jpg',
  current: 1,
  total: 5,
  onKeep: jest.fn(),
  onSkip: jest.fn(),
}

test('renders recipe title', () => {
  render(<RecipeCard {...props} />)
  expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
})

test('renders progress indicator', () => {
  render(<RecipeCard {...props} />)
  expect(screen.getByText('1 of 5')).toBeInTheDocument()
})

test('calls onKeep when Keep button clicked', () => {
  render(<RecipeCard {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /keep/i }))
  expect(props.onKeep).toHaveBeenCalledTimes(1)
})

test('calls onSkip when Skip button clicked', () => {
  render(<RecipeCard {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /skip/i }))
  expect(props.onSkip).toHaveBeenCalledTimes(1)
})
