import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { MapPin, ArrowLeft } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()

  useEffect(() => {
    adminAPI.getSummary()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold">Civil<span className="text-emerald-400">Verge</span></span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/admin" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition flex items-center gap-2 border border-slate-700 px-3 py-1.5 rounded-lg">
            <ArrowLeft size={14} /> Back to Admin
          </Link>
          <span className="text-slate-400 text-sm hidden sm:block border-l border-slate-700 pl-6">Admin: {user?.username}</span>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
            <h1 className="text-4xl font-black mb-2">Platform Analytics</h1>
            <p className="text-slate-400 text-lg">Visual insights into city reporting and department workload.</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-20 flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
             Generating analytics reports...
          </div>
        ) : !data ? (
          <div className="text-center text-red-500 py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">Failed to load analytics data.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Categories Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-slate-200">Reports by Category</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Departments Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-slate-200">Department Workload</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departments} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
                    <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff' }}
                        cursor={{fill: '#1e293b'}}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {data.departments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl lg:col-span-2">
              <h2 className="text-xl font-bold mb-6 text-slate-200">Issue Priorities</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.priorities} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#64748b" style={{ textTransform: 'capitalize' }} />
                    <YAxis stroke="#64748b" />
                    <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff' }}
                        cursor={{fill: '#1e293b'}}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {data.priorities.map((entry, index) => {
                            const priorityColors = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#94a3b8' };
                            return <Cell key={`cell-${index}`} fill={priorityColors[entry.name.toLowerCase()] || '#10b981'} />
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
