// app/agencies/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import MemberForm from '@/components/MemberForm'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  membershipType: string
  status: string
  createdAt: string
}

interface Agency {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  website: string | null
  primaryContactName: string | null
  primaryContactEmail: string | null
  primaryContactPhone: string | null
  status: string
  users: Member[]
  _count: {
    users: number
    events: number
    documents: number
  }
}

export default function AgencyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showEditMember, setShowEditMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const metadata = user?.unsafeMetadata as any
  const userRole = metadata?.role || 'AGENCY_USER'

  useEffect(() => {
    fetchAgency()
  }, [params.id])

  const fetchAgency = async () => {
    try {
      const response = await fetch(`/api/agencies/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setAgency(data)
      }
    } catch (error) {
      console.error('Error fetching agency:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchAgency() // Refresh the data
      }
    } catch (error) {
      console.error('Error deleting member:', error)
    }
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

  const getMembershipBadgeColor = (type: string) => {
    switch (type) {
      case 'A1_AGENCY':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'A2_BRANCH':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'A3_ASSOCIATE':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'STERLING_PARTNER':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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

  if (!agency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
          <p className="text-white">Agency not found</p>
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
              <button
                onClick={() => router.push('/agencies')}
                className="text-white/70 hover:text-white mb-2 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Agencies
              </button>
              <h1 className="text-3xl font-bold text-white mb-2">{agency.name}</h1>
              <p className="text-white/70">{agency.city}, {agency.state}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(agency.status)}`}>
              {agency.status}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Members</p>
                <p className="text-3xl font-bold text-white">{agency._count.users}</p>
              </div>
              <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-white">{agency._count.events}</p>
              </div>
              <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Documents</p>
                <p className="text-3xl font-bold text-white">{agency._count.documents}</p>
              </div>
              <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg mb-8">
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-white border-b-2 border-purple-400'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-white border-b-2 border-purple-400'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Members ({agency._count.users})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/70 text-sm">Email</p>
                      <p className="text-white">{agency.email}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Phone</p>
                      <p className="text-white">{agency.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Website</p>
                      <p className="text-white">{agency.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Address</p>
                      <p className="text-white">
                        {agency.address}<br />
                        {agency.city}, {agency.state} {agency.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Primary Contact</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/70 text-sm">Name</p>
                      <p className="text-white">{agency.primaryContactName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Email</p>
                      <p className="text-white">{agency.primaryContactEmail || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Phone</p>
                      <p className="text-white">{agency.primaryContactPhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Agency Members</h3>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'AGENCY_ADMIN') && (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      + Add Member
                    </button>
                  )}
                </div>

                {agency.users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-white/70 font-medium">Name</th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">Email</th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">Phone</th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">Membership</th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agency.users.map((member) => (
                          <tr key={member.id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4 text-white">
                              {member.firstName} {member.lastName}
                            </td>
                            <td className="py-3 px-4 text-white/70">{member.email}</td>
                            <td className="py-3 px-4 text-white/70">{member.phone || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getMembershipBadgeColor(member.membershipType)}`}>
                                {formatMembershipType(member.membershipType)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(member.status)}`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMember(member)
                                    setShowEditMember(true)
                                  }}
                                  className="text-white/70 hover:text-white transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {userRole === 'SUPER_ADMIN' && (
                                  <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-white/70">No members found for this agency</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Add New Member</h2>
              <MemberForm
                agencyId={agency.id}
                onClose={() => setShowAddMember(false)}
                onSuccess={() => {
                  setShowAddMember(false)
                  fetchAgency()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMember && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Edit Member</h2>
              <MemberForm
                member={selectedMember}
                onClose={() => {
                  setShowEditMember(false)
                  setSelectedMember(null)
                }}
                onSuccess={() => {
                  setShowEditMember(false)
                  setSelectedMember(null)
                  fetchAgency()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}