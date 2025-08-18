import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8">⚡ MemberHub Pro</h1>
        <p className="text-xl text-white/80 mb-8">Next-Generation Membership Management Platform</p>
        <Link 
          href="/dashboard" 
          className="px-8 py-4 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-all inline-block"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  )
}