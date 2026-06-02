import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reportsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { MapPin, Plus, Clock, CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react'

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  in_progress: { label: 'In Progress', icon: AlertCircle,   color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  resolved:    { label: 'Resolved',    icon: CheckCircle,   color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/20' },
  rejected:    { label: 'Rejected',    icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
}

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      bg: 'bg-slate-800 text-slate-400' },
  medium:   { label: 'Medium',   bg: 'bg-blue-500/20 text-blue-400' },
  high:     { label: 'High',     bg: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'Critical', bg: 'bg-red-500/20 text-red-400 font-bold' },
}

export default function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()

  useEffect(() => {
    reportsAPI.getMine()
      .then(res => setReports(res.data))
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
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition">
              Admin Dashboard
            </Link>
          )}
          <span className="text-slate-400 text-sm hidden sm:block">Hello, {user?.username}</span>
          <Link to="/submit" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium">
            <Plus size={16} /> New Report
          </Link>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-black mb-3">My Reports</h1>
        <p className="text-slate-400 mb-8 text-lg">Track the status and timeline of your submitted issues.</p>

        {loading ? (
          <div className="text-center text-slate-400 py-20 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            Loading your reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="text-slate-500 mb-4 text-lg">You haven't submitted any reports yet.</div>
            <Link to="/submit" className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 transition font-bold shadow-lg shadow-emerald-500/20">
              <Plus size={18} /> Submit your first report
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map(report => {
              const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
              const priority = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.medium
              const StatusIcon = status.icon
              
              return (
                <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden relative shadow-xl hover:border-slate-700 transition duration-300">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo Thumbnail */}
                    {report.photo_url && (
                        <div className="md:w-1/4 shrink-0">
                            <div className="h-32 md:h-full w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                                <img 
                                    src={`${import.meta.env.VITE_API_URL}${report.photo_url}`} 
                                    alt="Issue Evidence" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="font-bold text-2xl">{report.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${status.bg} ${status.color}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${priority.bg}`}>
                          Priority: {priority.label}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 text-sm mb-4 leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">{report.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium mb-4">
                        <span className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"><MapPin size={14} className="text-emerald-500" /> {report.location}</span>
                        <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">🏷️ {report.category}</span>
                        <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">🕐 {new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {report.ai_summary && (
                        <div className="mt-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400/90 shadow-inner">
                          <div className="flex gap-2 items-start">
                            <span className="text-lg">🤖</span>
                            <div>
                                <span className="font-semibold block mb-1">AI Triage Summary</span>
                                {report.ai_summary}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status Timeline */}
                      {report.history && report.history.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                <Clock size={16} className="text-slate-500" /> Status Timeline
                            </h4>
                            <div className="space-y-4">
                                {report.history.sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at)).map((hist, index) => {
                                    const hStatus = STATUS_CONFIG[hist.status] || STATUS_CONFIG.pending
                                    const HIcon = hStatus.icon
                                    return (
                                        <div key={hist.id} className="flex items-start gap-4 relative">
                                            {/* Timeline connecting line */}
                                            {index !== report.history.length - 1 && (
                                                <div className="absolute left-4 top-8 bottom-[-16px] w-[2px] bg-slate-800 rounded-full z-0"></div>
                                            )}
                                            <div className={`w-8 h-8 rounded-full ${hStatus.bg} ${hStatus.color} flex items-center justify-center shrink-0 z-10 border-2 border-slate-900`}>
                                                <HIcon size={14} />
                                            </div>
                                            <div className="pt-1.5">
                                                <p className="text-sm font-medium text-slate-300">Changed to {hStatus.label}</p>
                                                <p className="text-xs text-slate-500">{new Date(hist.changed_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}