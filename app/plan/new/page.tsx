import { fetchAreas } from '@/lib/themealdb'
import PlanForm from './PlanForm'

export default async function PlanNewPage() {
  const areas = await fetchAreas()
  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <PlanForm areas={areas} />
    </main>
  )
}
