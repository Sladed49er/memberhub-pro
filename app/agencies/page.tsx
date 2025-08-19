// app/agencies/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface Agency {
  id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  status: string
  _count: {
    users: number  // Changed from members to users
  }
}

export default function AgenciesPage() {
  const router = useRouter()
  const { user } = useUser()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const metadata = user?.unsafeMetadata as any
  const userRole = metadata?.role || 'AGENCY_USER'

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/agencies')
      if (response.ok) {
        const data = await response.json()
        setAgencies(data)
      }
    } catch (error) {
      console.error('Error fetching agencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agency.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agency.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || agency.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'INACTIVE':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'SUSPENDED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Agencies</h1>
              <p className="text-white/70">Manage your insurance agencies and partners</p>
            </div>
            {userRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                + Add Agency
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Status Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL" className="bg-purple-900">All Status</option>
                <option value="ACTIVE" className="bg-purple-900">Active</option>
                <option value="INACTIVE" className="bg-purple-900">Inactive</option>
                <option value="SUSPENDED" className="bg-purple-900">Suspended</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-white">
                Total: {filteredAgencies.length} agencies
              </div>
            </div>
          </div>
        </div>

        {/* Agencies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/agencies/${agency.id}`}
              className="group"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer transform hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-purple-200 transition-colors">
                    {agency.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(agency.status)}`}>
                    {agency.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-white/70">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{agency.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">{agency.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{agency.city}, {agency.state}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm text-white/70">
                        {agency._count.users} members
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredAgencies.length === 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-white/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-white/70 text-lg">No agencies found</p>
            <p className="text-white/50 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add Agency Modal (placeholder for now) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg max-w-2xl w-full">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Add New Agency</h2>
              <p className="text-white/70">Agency form will be implemented here</p>
              <button
                onClick={() => setShowAddModal(false)}
                className="mt-4 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}