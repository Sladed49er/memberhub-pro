// components/MemberForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MemberFormProps {
  member?: any // For edit mode
  agencyId?: string // For agency-specific member creation
  onClose?: () => void
  onSuccess?: () => void
}

export default function MemberForm({ member, agencyId, onClose, onSuccess }: MemberFormProps) {
  const router = useRouter()
  const isEditMode = !!member
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipType: 'A1_AGENCY',
    agencyId: agencyId || '',
    status: 'ACTIVE',
  })
  const [agencies, setAgencies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Membership type options - not editable, just selectable
  const membershipTypes = [
    { value: 'A1_AGENCY', label: 'A1 - Agency' },
    { value: 'A2_BRANCH', label: 'A2 - Branch' },
    { value: 'A3_ASSOCIATE', label: 'A3 - Associate' },
    { value: 'STERLING_PARTNER', label: 'Sterling Partner' },
  ]

  useEffect(() => {
    // If editing, populate form with member data
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phone: member.phone || '',
        membershipType: member.membershipType || 'A1_AGENCY',
        agencyId: member.agencyId || '',
        status: member.status || 'ACTIVE',
      })
    }

    // Fetch agencies for dropdown
    fetchAgencies()
  }, [member])

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/agencies')
      if (response.ok) {
        const data = await response.json()
        setAgencies(data)
      }
    } catch (error) {
      console.error('Error fetching agencies:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEditMode ? `/api/members/${member.id}` : '/api/members'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save member')
      }

      if (onSuccess) {
        onSuccess()
      }
      
      if (onClose) {
        onClose()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            First Name
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="John"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Last Name
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Doe"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="john.doe@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Membership Type */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Membership Type
          </label>
          <select
            value={formData.membershipType}
            onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            {membershipTypes.map((type) => (
              <option 
                key={type.value} 
                value={type.value}
                className="bg-purple-900 text-white"
              >
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agency */}
        {!agencyId && (
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Agency
            </label>
            <select
              value={formData.agencyId}
              onChange={(e) => setFormData({ ...formData, agencyId: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-purple-900 text-white">Select an agency</option>
              {agencies.map((agency) => (
                <option 
                  key={agency.id} 
                  value={agency.id}
                  className="bg-purple-900 text-white"
                >
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="ACTIVE" className="bg-purple-900 text-white">Active</option>
            <option value="INACTIVE" className="bg-purple-900 text-white">Inactive</option>
            <option value="SUSPENDED" className="bg-purple-900 text-white">Suspended</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/15 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditMode ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}