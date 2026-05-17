'use client'

import { useState } from 'react'
import type { ShoppingItem } from '@/types'

export default function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const byCategory = items.reduce<Record<string, ShoppingItem[]>>(
    (acc, item) => {
      const cat = item.category || 'Other'
      acc[cat] = acc[cat] ?? []
      acc[cat].push(item)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => (
        <div key={category}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">
            {category}
          </h3>
          <ul className="space-y-2">
            {catItems.map(item => {
              const key = `${item.name}__${item.unit}`
              const isChecked = checked.has(key)
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(key)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span className={`flex-1 text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.amount} {item.unit}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
