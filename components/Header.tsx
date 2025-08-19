// components/Header.tsx
'use client'

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser
} from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const { user } = useUser()
  
  // Don't show header on dashboard, sign-in, sign-up, or onboarding pages
  const hideHeader = ['/dashboard', '/sign-in', '/sign-up', '/onboarding'].some(
    path => pathname.startsWith(path)
  )
  
  if (hideHeader) return null

  // Get user role from metadata
  const metadata = user?.unsafeMetadata as any
  const userRole = metadata?.role as string
  const getRoleBadge = () => {
    if (userRole === 'SUPER_ADMIN') return { color: 'from-red-500 to-pink-600', icon: '👑', label: 'Super Admin' }
    if (userRole === 'AGENCY_ADMIN') return { color: 'from-blue-500 to-purple-600', icon: '🏢', label: 'Agency Admin' }
    return null
  }
  const roleBadge = getRoleBadge()

  return (
    <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">⚡ MemberHub Pro</span>
          {roleBadge && (
            <div className={`px-3 py-1 bg-gradient-to-r ${roleBadge.color} rounded-full flex items-center gap-2`}>
              <span>{roleBadge.icon}</span>
              <span className="text-white text-sm font-medium">{roleBadge.label}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-all font-medium">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <span className="text-white">Welcome, {user?.firstName || 'User'}</span>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}