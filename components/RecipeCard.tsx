import Image from 'next/image'

type Props = {
  title: string
  image: string
  current: number
  total: number
  onKeep: () => void
  onSkip: () => void
}

export default function RecipeCard({ title, image, current, total, onKeep, onSkip }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-sm mx-auto">
      <div className="relative h-56 w-full">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-5">
        <p className="text-xs text-gray-400 font-medium mb-1 text-center">
          {current} of {total} meals chosen
        </p>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-5">{title}</h2>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            aria-label="Skip"
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold hover:border-red-300 hover:text-red-400 transition-colors"
          >
            ✕ Skip
          </button>
          <button
            onClick={onKeep}
            aria-label="Keep"
            className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            ✓ Keep
          </button>
        </div>
      </div>
    </div>
  )
}
