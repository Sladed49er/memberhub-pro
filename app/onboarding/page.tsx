// app/onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// Define super admin emails
const SUPER_ADMIN_EMAILS = [
  'admin@memberhub.com',
  // Add your email here to make yourself super admin
  'matt@everysolutionit.com'
];

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: '',
    agencyName: '',
    agencyCode: '',
    membershipType: 'A1_AGENCY'
  })

  // Auto-detect super admin
  useEffect(() => {
    if (user?.emailAddresses[0]?.emailAddress) {
      const userEmail = user.emailAddresses[0].emailAddress;
      if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
        setFormData(prev => ({ ...prev, role: 'SUPER_ADMIN' }));
        // Auto-submit for super admin
        handleSuperAdminSetup();
      }
    }
  }, [user]);

  const handleSuperAdminSetup = async () => {
    if (!user) return;
    
    try {
      // Use unsafeMetadata instead of publicMetadata to avoid type errors
      await user.update({
        unsafeMetadata: {
          role: 'SUPER_ADMIN',
          onboarded: true
        }
      });

      await fetch('/api/users/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName} ${user.lastName}`,
          role: 'SUPER_ADMIN'
        })
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Super admin setup error:', error);
    }
  };

  const handleRoleSelection = async (role: string) => {
    setFormData({ ...formData, role })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use unsafeMetadata instead of publicMetadata
      await user?.update({
        unsafeMetadata: {
          role: formData.role,
          agencyName: formData.agencyName,
          membershipType: formData.membershipType,
          onboarded: true
        }
      })

      // Save to database
      await fetch('/api/users/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
          name: `${user?.firstName} ${user?.lastName}`,
          role: formData.role,
          agencyName: formData.agencyName,
          membershipType: formData.membershipType
        })
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading for super admin auto-setup
  if (SUPER_ADMIN_EMAILS.includes(user?.emailAddresses[0]?.emailAddress || '')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20 text-center">
          <span className="text-6xl mb-4 block">👑</span>
          <h2 className="text-3xl font-bold text-white mb-4">Welcome, Super Admin!</h2>
          <p className="text-white/80">Setting up your admin access...</p>
          <div className="mt-6">
            <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData.role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-4xl w-full border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">Welcome to MemberHub Pro!</h1>
          <p className="text-white/80 text-center mb-8">Let&apos;s get you set up. First, what&apos;s your role?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agency Admin */}
            <button
              onClick={() => handleRoleSelection('AGENCY_ADMIN')}
              className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <div className="text-white">
                <span className="text-4xl mb-4 block">🏢</span>
                <h3 className="text-xl font-bold mb-2">Agency Admin</h3>
                <p className="text-sm text-white/80">Manage your agency, members, and settings</p>
              </div>
            </button>

            {/* Agency User */}
            <button
              onClick={() => handleRoleSelection('AGENCY_USER')}
              className="bg-gradient-to-br from-green-500 to-teal-600 p-6 rounded-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <div className="text-white">
                <span className="text-4xl mb-4 block">👤</span>
                <h3 className="text-xl font-bold mb-2">Agency Member</h3>
                <p className="text-sm text-white/80">Access agency resources and your profile</p>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Super Admin access is restricted to authorized emails only
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6">Complete Your Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {formData.role !== 'SUPER_ADMIN' && (
            <>
              <div>
                <label className="block text-white/90 mb-2 font-medium">
                  {formData.role === 'AGENCY_ADMIN' ? 'Agency Name *' : 'Your Agency Code *'}
                </label>
                <input
                  type="text"
                  value={formData.role === 'AGENCY_ADMIN' ? formData.agencyName : formData.agencyCode}
                  onChange={(e) => 
                    setFormData({
                      ...formData,
                      [formData.role === 'AGENCY_ADMIN' ? 'agencyName' : 'agencyCode']: e.target.value
                    })
                  }
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40"
                  placeholder={formData.role === 'AGENCY_ADMIN' ? 'Enter your agency name' : 'Enter agency code provided by your admin'}
                />
              </div>

              {formData.role === 'AGENCY_ADMIN' && (
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Membership Type</label>
                  <select
                    value={formData.membershipType}
                    onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:bg-white/15 focus:border-white/40"
                  >
                    <option value="A1_AGENCY">A1 - Agency Membership</option>
                    <option value="A2_BRANCH">A2 - Branch</option>
                    <option value="A3_ASSOCIATE">A3 - Associate</option>
                    <option value="STERLING_PARTNER">Sterling Partner</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: '' })}
              className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}