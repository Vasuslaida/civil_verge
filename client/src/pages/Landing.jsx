import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MapPin, AlertTriangle, CheckCircle, BarChart3, ArrowRight, Shield, Zap, Users } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalReportsResolved: null,
    totalUsers: null,
    mostCommonCategory: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/summary`)
        if (!response.ok) throw new Error('API request failed')
        const data = await response.json()
        setStats({
          totalReportsResolved: data.totalReportsResolved ?? 0,
          totalUsers: data.totalUsers ?? 0,
          mostCommonCategory: data.mostCommonCategory ?? 'N/A'
        })
      } catch (error) {
        console.error('Error fetching analytics stats:', error)
        setStats({
          totalReportsResolved: 0,
          totalUsers: 0,
          mostCommonCategory: 'N/A'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Civil<span className="text-emerald-400">Verge</span></span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition">Admin Dashboard</Link>
              )}
              <Link to="/my-reports" className="text-sm text-slate-300 hover:text-white transition">My Reports</Link>
              <Link to="/submit" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg transition">
                Report Issue
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition">Login</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-8 py-28">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-2 rounded-full mb-8">
          <Zap size={14} />
          AI-Powered City Problem Tracking
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-6 leading-tight">
          Report City Problems.<br />
          <span className="text-emerald-400">Get Them Fixed.</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          CivilVerge uses AI to automatically classify, prioritize, and route your complaints to the right city department — fast.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 transition text-lg">
            Report an Issue <ArrowRight size={20} />
          </Link>
          <Link to="/login" className="border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold px-8 py-4 rounded-xl transition text-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 max-w-3xl mx-auto px-8 pb-20">
        {[
          { label: 'Reports Resolved', value: stats.totalReportsResolved },
          { label: 'Registered Users', value: stats.totalUsers },
          { label: 'Most Common Category', value: stats.mostCommonCategory },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-emerald-400 mb-1 min-h-[36px] flex items-center justify-center">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-800 animate-pulse rounded"></span>
              ) : (
                stat.value
              )}
            </div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="px-8 py-20 bg-slate-900/50">
        <h2 className="text-3xl font-black text-center mb-12 tracking-tight">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: AlertTriangle, title: 'Report the Problem', desc: 'Submit a complaint with photo, location, and description in under a minute.', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { icon: Zap, title: 'AI Triage', desc: 'Claude AI instantly classifies, prioritizes, and routes it to the right department.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { icon: CheckCircle, title: 'Track & Resolve', desc: 'Get real-time status updates as the city works to fix the issue.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
          ].map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon size={24} className={f.color} />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-8 py-20">
        <h2 className="text-3xl font-black text-center mb-12 tracking-tight">What Can You Report?</h2>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {['Potholes', 'Broken Streetlights', 'Garbage Collection', 'Water Leaks', 'Sewage Issues', 'Road Damage', 'Park Damage', 'Noise Complaints'].map((cat) => (
            <span key={cat} className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm hover:border-emerald-500 hover:text-emerald-400 transition cursor-default">
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-16 max-w-3xl mx-auto">
          <Shield size={40} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-4xl font-black mb-4 tracking-tight">Your City. Your Voice.</h2>
          <p className="text-slate-400 mb-8">Join thousands of citizens making their city better, one report at a time.</p>
          <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-xl inline-flex items-center gap-2 transition text-lg">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-8 text-center text-slate-500 text-sm">
        © 2025 CivilVerge. Built for better cities.
      </footer>
    </div>
  )
}