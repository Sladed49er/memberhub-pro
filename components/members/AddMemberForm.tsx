// components/AddMemberForm.tsx
'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface AddMemberFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddMemberForm({ isOpen, onClose, onSuccess }: AddMemberFormProps) {
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create member')
      }

      const data = await response.json()
      toast.success(`Successfully added ${data.name}!`)
      
      // Reset form
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
      
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('Failed to add member. Please try again.')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'membershipLevel' ? parseInt(value) : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Add New Member</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/90 mb-2 font-medium">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-white/90 mb-2 font-medium">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
              placeholder="member@agency.com"
            />
          </div>

          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Agency/Company *
            </label>
            <input
              type="text"
              name="agencyName"
              value={formData.agencyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
              placeholder="Enter agency name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/90 mb-2 font-medium">
                Membership Type
              </label>
              <select
                name="membershipType"
                value={formData.membershipType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
              >
                <option value="A1_AGENCY">A1 - Agency Membership</option>
                <option value="A2_BRANCH">A2 - Branch</option>
                <option value="A3_ASSOCIATE">A3 - Associate</option>
                <option value="STERLING_PARTNER">Sterling Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-white/90 mb-2 font-medium">
                Membership Level
              </label>
              <select
                name="membershipLevel"
                value={formData.membershipLevel}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
              >
                <option value="1">1-4 Producers</option>
                <option value="2">5-9 Producers</option>
                <option value="3">10-19 Producers</option>
                <option value="4">20-49 Producers</option>
                <option value="5">50+ Producers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all resize-none"
              placeholder="Additional information..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Adding...
                </span>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}