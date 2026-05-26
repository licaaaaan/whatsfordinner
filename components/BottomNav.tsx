'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function isHidden(pathname: string) {
  if (pathname === '/login' || pathname === '/plan/new') return true
  if (/^\/plan\/[^/]+\/review$/.test(pathname)) return true
  return false
}

export default function BottomNav() {
  const pathname = usePathname()

  if (isHidden(pathname)) return null

  const planMatch = pathname.match(/^\/plan\/([^/]+)/)
  const planId = planMatch?.[1]
  const shoppingHref = planId ? `/plan/${planId}/shopping-list` : '/'

  const isHome = pathname === '/'
  const isShopping = !!planId && pathname.endsWith('/shopping-list')
  const isProfile = pathname.startsWith('/profile')

  const active = 'text-orange-500'
  const inactive = 'text-gray-400 hover:text-orange-400 transition-colors'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex h-16 z-50 safe-area-inset-bottom">
      <Link href={shoppingHref} className={`flex flex-col items-center justify-center flex-1 gap-0.5 ${isShopping ? active : inactive}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 6h11.7M9 19.5a.5.5 0 11-1 0 .5.5 0 011 0zm7 0a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
        <span className="text-xs font-medium">List</span>
      </Link>

      <Link href="/" className={`flex flex-col items-center justify-center flex-1 gap-0.5 ${isHome ? active : inactive}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-xs font-medium">Home</span>
      </Link>

      <Link href="/profile" className={`flex flex-col items-center justify-center flex-1 gap-0.5 ${isProfile ? active : inactive}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-xs font-medium">Profile</span>
      </Link>
    </nav>
  )
}
