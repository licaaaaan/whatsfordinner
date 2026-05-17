import { getTopCuisines } from '@/lib/taste-profile'

export default function CuisineChart({
  scores,
}: {
  scores: Record<string, number>
}) {
  const top = getTopCuisines(scores, 6)
  const max = top[0]?.score ?? 1

  if (top.length === 0) {
    return (
      <p className="text-gray-400 text-sm">
        No preferences recorded yet — start planning!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {top.map(({ cuisine, score }) => (
        <div key={cuisine}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize text-gray-700">{cuisine}</span>
            <span className="text-gray-400">{score}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-orange-400 h-2.5 rounded-full transition-all"
              style={{ width: `${(score / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
