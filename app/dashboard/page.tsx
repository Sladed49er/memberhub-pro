// app/dashboard/page.tsx - Just the relevant parts to update
'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agencyName: '',
    membershipType: 'A1_AGENCY',
    membershipLevel: 1,
    notes: ''
  })

  // Check if user needs onboarding
  useEffect(() => {
    if (isLoaded && user) {
      // Use unsafeMetadata instead of publicMetadata
      const metadata = user.unsafeMetadata as any
      const isOnboarded = metadata?.onboarded
      if (!isOnboarded) {
        router.push('/onboarding')
      }
    }
  }, [isLoaded, user, router])

  // Get user role from unsafeMetadata
  const metadata = user?.unsafeMetadata as any
  const userRole = metadata?.role as string || 'AGENCY_USER'
  const agencyName = metadata?.agencyName as string || 'Your Agency'

  // Rest of your dashboard code stays the same...
  // Just replace all instances of user?.publicMetadata with metadata

  const stats = [
    {
      title: 'Total Members',
      value: members.length.toString(),
      change: '+12.5%',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Active Agencies', 
      value: '482',
      change: '+8.3%',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Upcoming Events',
      value: '23',
      change: '-2',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Monthly Revenue',
      value: '$284K',
      change: '+18.2%',
      color: 'from-orange-500 to-red-600'
    }
  ]

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members?limit=10')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          agencyName: '',
          membershipType: 'A1_AGENCY',
          membershipLevel: 1,
          notes: ''
        })
        
        setShowAddModal(false)
        fetchMembers()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to add member. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'membershipLevel' ? parseInt(value) : value
    }))
  }

  const formatMembershipType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'A1_AGENCY': 'A1 - Agency',
      'A2_BRANCH': 'A2 - Branch',
      'A3_ASSOCIATE': 'A3 - Associate',
      'STERLING_PARTNER': 'Sterling Partner'
    }
    return typeMap[type] || type
  }

  const getRoleBadge = () => {
    const badges: { [key: string]: { color: string, icon: string, label: string } } = {
      'SUPER_ADMIN': { color: 'from-red-500 to-pink-600', icon: '👑', label: 'Super Admin' },
      'AGENCY_ADMIN': { color: 'from-blue-500 to-purple-600', icon: '🏢', label: 'Agency Admin' },
      'AGENCY_USER': { color: 'from-green-500 to-teal-600', icon: '👤', label: 'Member' }
    }
    return badges[userRole] || badges['AGENCY_USER']
  }

  const roleBadge = getRoleBadge()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-white">⚡ MemberHub Pro</span>
              <div className={`px-3 py-1 bg-gradient-to-r ${roleBadge.color} rounded-full flex items-center gap-2`}>
                <span>{roleBadge.icon}</span>
                <span className="text-white text-sm font-medium">{roleBadge.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white/80">
                <span className="text-sm">Welcome, </span>
                <span className="font-medium">{user?.firstName || 'User'}</span>
              </div>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Rest of the dashboard JSX stays exactly the same */}
      {/* ... */}
    </div>
  )
}