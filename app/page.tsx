// app/page.tsx
'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    // If user is signed in, redirect to dashboard
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-white mb-4">Welcome to MemberHub Pro</h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Next-Generation Membership Management Platform for Agencies
          </p>
          
          <SignedIn>
            <div className="space-y-4">
              <Link 
                href="/dashboard" 
                className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-all font-semibold text-lg shadow-xl"
              >
                Go to Dashboard →
              </Link>
              <p className="text-white/60">Redirecting to dashboard...</p>
            </div>
          </SignedIn>
          
          <SignedOut>
            <div className="space-y-4">
              <p className="text-white/80 mb-4">Sign in or create an account to get started</p>
              <div className="flex gap-4 justify-center">
                <Link 
                  href="/sign-in"
                  className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-all font-medium"
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up"
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-all font-medium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </SignedOut>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <span className="text-4xl mb-4 block">👥</span>
              <h3 className="text-white font-semibold mb-2">Member Management</h3>
              <p className="text-white/70 text-sm">Track and manage all your agency members in one place</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <span className="text-4xl mb-4 block">📊</span>
              <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-white/70 text-sm">Get insights with powerful reporting and analytics</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <span className="text-4xl mb-4 block">🔐</span>
              <h3 className="text-white font-semibold mb-2">Secure & Scalable</h3>
              <p className="text-white/70 text-sm">Enterprise-grade security with role-based access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}