// app/dashboard/page.tsx
export default function Dashboard() {
  const stats = [
    {
      title: 'Total Members',
      value: '2,847',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">⚡ MemberHub Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                🔔
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/10 backdrop-blur-md min-h-screen p-4">
          <ul className="space-y-2">
            {['Dashboard', 'Members', 'Agencies', 'Events', 'Education', 'Billing', 'Communications', 'Documents', 'Reports', 'Settings'].map((item, index) => (
              <li key={item}>
                <a
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    index === 0
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{item}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}>
                    <span className="text-white text-2xl">📊</span>
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
              <h2 className="text-2xl font-bold text-white">Recent Members</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                  Export
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                  + Add Member
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">🔍</span>
              <input
                type="text"
                placeholder="Search members, agencies, or membership types..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40"
              />
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
                    <th className="text-left py-3 px-4 text-white/80">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          JA
                        </div>
                        <div>
                          <p className="text-white font-semibold">Jennifer Anderson</p>
                          <p className="text-white/60 text-sm">j.anderson@premiumins.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white/80">Premium Insurance Group</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        A1 - Agency
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white/80">Jan 15, 2025</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-white/60 hover:text-white transition-colors">
                        View →
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          MS
                        </div>
                        <div>
                          <p className="text-white font-semibold">Michael Sterling</p>
                          <p className="text-white/60 text-sm">m.sterling@sterlingpartners.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white/80">Sterling Partners LLC</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        A3 - Associate
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white/80">Jan 12, 2025</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-white/60 hover:text-white transition-colors">
                        View →
                      </button>
                    </td>
                  </tr>
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

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl shadow-xl hover:shadow-2xl transition-all hover:scale-110">
        +
      </button>
    </div>
  )
}