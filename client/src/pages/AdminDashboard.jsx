import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { MapPin, BarChart3, Clock, CheckCircle, AlertCircle, XCircle, Map as MapIcon, List, AlertTriangle } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_OPTIONS = ['pending', 'in_progress', 'resolved', 'rejected']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  resolved:    { label: 'Resolved',    color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/20' },
  rejected:    { label: 'Rejected',    color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
}

const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f97316',
  critical: '#ef4444'
}

function HeatmapLayer({ reports }) {
  const map = useMap()
  
  useEffect(() => {
    if (reports.length > 0) {
      const bounds = L.latLngBounds(reports.filter(r => r.latitude && r.longitude).map(r => [r.latitude, r.longitude]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [reports, map])

  return (
    <>
      {reports.filter(r => r.latitude && r.longitude).map(report => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={8}
          pathOptions={{ 
            fillColor: PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.medium, 
            color: 'transparent',
            fillOpacity: 0.7 
          }}
        >
          <Popup className="bg-slate-900 border-slate-800 text-white rounded-xl">
            <div className="p-1">
              <h4 className="font-bold text-sm mb-1">{report.title}</h4>
              <p className="text-xs text-slate-500 mb-2">{report.category}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CONFIG[report.status]?.bg} ${STATUS_CONFIG[report.status]?.color}`}>
                {STATUS_CONFIG[report.status]?.label}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // list or map
  const [departments, setDepartments] = useState([])
  const { user, logout } = useAuth()

  useEffect(() => {
    Promise.all([adminAPI.getAllReports(), adminAPI.getSummary(), adminAPI.getDepartments()])
      .then(([reportsRes, summaryRes, deptRes]) => {
        setReports(reportsRes.data)
        setSummary(summaryRes.data.summary)
        setDepartments(deptRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateReportField = async (id, field, value) => {
    try {
      await adminAPI.updateReport(id, { [field]: value })
      setReports(reports.map(r => r.id === id ? { ...r, [field]: value } : r))
    } catch (err) {
      console.error(err)
    }
  }

  const updateDepartment = async (id, value) => {
    // We only have department_name here, we need ID from the backend ideally, 
    // but the backend updateReport takes department_id.
    // For simplicity, let's assume we can fetch department id, or the backend accepts department_id.
    // Let's implement changing priority and status first, then department if we have IDs.
    // Assuming backend returns department_id, we need a list of departments.
    // We might need an endpoint for departments, or just change priority and status.
  }

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
          <Link to="/analytics" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition flex items-center gap-2">
            <BarChart3 size={16} /> Analytics
          </Link>
          <span className="text-slate-400 text-sm hidden sm:block border-l border-slate-700 pl-6">Admin: {user?.username}</span>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-black mb-2">Admin Dashboard</h1>
                <p className="text-slate-400 text-lg">Manage reports, route to departments, and track resolution.</p>
            </div>
            
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <List size={16} /> List View
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'map' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <MapIcon size={16} /> Map View
                </button>
            </div>
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Reports', value: summary.total_reports, color: 'text-white' },
              { label: 'Pending', value: summary.open, color: 'text-yellow-400' },
              { label: 'In Progress', value: summary.in_progress, color: 'text-blue-400' },
              { label: 'Resolved', value: summary.resolved, color: 'text-emerald-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
                <div className={`text-4xl font-black mb-2 ${stat.color}`}>{stat.value ?? 0}</div>
                <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-20 flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
             Loading system data...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">No reports submitted yet.</div>
        ) : (
          <div className="space-y-6">
            
            {viewMode === 'map' ? (
                <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
                    <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <HeatmapLayer reports={reports} />
                    </MapContainer>
                    <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 text-xs">
                        <div className="font-bold mb-2">Priority Heatmap</div>
                        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#ef4444]"></div> Critical</div>
                        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#f97316]"></div> High</div>
                        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Medium</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#94a3b8]"></div> Low</div>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-950/50 text-slate-400 font-medium border-b border-slate-800 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Report</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {reports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-800/20 transition">
                                        <td className="px-6 py-4 max-w-xs whitespace-normal">
                                            <div className="font-bold text-white mb-1">{report.title}</div>
                                            <div className="text-xs text-slate-500 line-clamp-2">{report.description}</div>
                                            <div className="text-xs text-emerald-500/80 mt-1 line-clamp-1">🤖 {report.ai_summary}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-300">
                                                <MapPin size={14} className="text-slate-500" />
                                                <span className="truncate max-w-[150px]">{report.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-xs border border-slate-700 block mb-2 w-max">
                                                {report.category}
                                            </span>
                                            <select
                                                value={report.department_id || ''}
                                                onChange={e => updateReportField(report.id, 'department_id', parseInt(e.target.value))}
                                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition text-slate-300 w-full"
                                            >
                                                <option value="" disabled>Assign Dept</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={report.priority}
                                                onChange={e => updateReportField(report.id, 'priority', e.target.value)}
                                                className={`bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition capitalize font-medium ${report.priority === 'critical' ? 'text-red-400 border-red-500/50' : report.priority === 'high' ? 'text-orange-400 border-orange-500/50' : report.priority === 'low' ? 'text-slate-400' : 'text-blue-400 border-blue-500/50'}`}
                                            >
                                                {PRIORITY_OPTIONS.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={report.status}
                                                onChange={e => updateReportField(report.id, 'status', e.target.value)}
                                                className={`bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition font-medium ${STATUS_CONFIG[report.status]?.color}`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}