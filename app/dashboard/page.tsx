// app/dashboard/page.tsx
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

  // Get user role from metadata
  const metadata = user?.unsafeMetadata as any
  const userRole = metadata?.role as string || 'SUPER_ADMIN' // Default to SUPER_ADMIN for you
  const agencyName = metadata?.agencyName as string || 'MemberHub Pro HQ'

  const stats = [
    {
      title: 'Total Members',
      value: members.length.toString(),
      change: '+12.5%',
      color: 'from-blue-500 to-indigo-600',
      icon: '👥'
    },
    {
      title: 'Active Agencies', 
      value: '12',
      change: '+8.3%',
      color: 'from-purple-500 to-pink-600',
      icon: '🏢'
    },
    {
      title: 'Upcoming Events',
      value: '5',
      change: '+2',
      color: 'from-green-500 to-teal-600',
      icon: '📅'
    },
    {
      title: 'Monthly Revenue',
      value: '$28.4K',
      change: '+18.2%',
      color: 'from-orange-500 to-red-600',
      icon: '💰'
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
        alert('Member added successfully!')
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
    return badges[userRole] || badges['SUPER_ADMIN']
  }

  const roleBadge = getRoleBadge()

  const sidebarItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '👥', label: 'Members' },
    { icon: '🏢', label: 'Agencies' },
    { icon: '📅', label: 'Events' },
    { icon: '🎓', label: 'Education' },
    { icon: '💰', label: 'Billing' },
    { icon: '📧', label: 'Communications' },
    { icon: '📁', label: 'Documents' },
    { icon: '📈', label: 'Reports' },
    { icon: '⚙️', label: 'Settings' }
  ]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
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
                <span className="font-medium">{user?.firstName || 'Admin'}</span>
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/10 backdrop-blur-md min-h-screen p-4">
          <div className="mb-6 p-4 bg-white/10 rounded-lg">
            <p className="text-white/70 text-sm">Organization</p>
            <p className="text-white font-semibold">{agencyName}</p>
          </div>
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => (
              <li key={item.label}>
                <a
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.active
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}>
                    <span className="text-white text-2xl">{stat.icon}</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-white/70">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Recent Members Table */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Members ({members.length})</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                + Add Member
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/80">Member</th>
                    <th className="text-left py-3 px-4 text-white/80">Agency</th>
                    <th className="text-left py-3 px-4 text-white/80">Type</th>
                    <th className="text-left py-3 px-4 text-white/80">Join Date</th>
                    <th className="text-left py-3 px-4 text-white/80">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-white/60">
                        Loading members...
                      </td>
                    </tr>
                  ) : members.length > 0 ? (
                    members.map((member: any) => (
                      <tr key={member.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {member.name ? member.name.substring(0, 2).toUpperCase() : 'NA'}
                            </div>
                            <div>
                              <p className="text-white font-semibold">{member.name || 'No Name'}</p>
                              <p className="text-white/60 text-sm">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/80">{member.agency?.name || 'No Agency'}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                            {member.agency ? formatMembershipType(member.agency.membershipType) : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/80">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-white/60">
                        <p className="text-lg mb-2">No members yet!</p>
                        <p>Click "Add Member" to get started.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[
              { icon: '📊', title: 'Generate Report', desc: 'Create custom reports' },
              { icon: '📧', title: 'Send Campaign', desc: 'Email your members' },
              { icon: '📅', title: 'Schedule Event', desc: 'Plan your next event' },
              { icon: '📂', title: 'Import Data', desc: 'Bulk import records' }
            ].map((action) => (
              <div
                key={action.title}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer hover:scale-105"
              >
                <span className="text-3xl mb-4 block">{action.icon}</span>
                <h3 className="text-white font-semibold mb-2">{action.title}</h3>
                <p className="text-white/60 text-sm">{action.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Add New Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40"
                  placeholder="member@agency.com"
                />
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">Agency/Company *</label>
                <input
                  type="text"
                  name="agencyName"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40"
                  placeholder="Enter agency name"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}