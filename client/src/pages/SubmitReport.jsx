import { useState, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { reportsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { MapPin, Send, Upload, X } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = [
  'Pothole', 'Broken Streetlight', 'Garbage Collection',
  'Water Leak', 'Sewage Issue', 'Road Damage', 'Park Damage', 'Noise Complaint', 'Other'
]

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

export default function SubmitReport() {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '' })
  const [position, setPosition] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('description', form.description)
    formData.append('category', form.category)
    formData.append('location', form.location)
    if (position) {
      formData.append('latitude', position.lat)
      formData.append('longitude', position.lng)
    }
    if (photo) {
      formData.append('photo', photo)
    }

    try {
      await reportsAPI.create(formData)
      setSuccess(true)
      setTimeout(() => navigate('/my-reports'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
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
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition">
              Admin Dashboard
            </Link>
          )}
          <Link to="/my-reports" className="text-sm text-slate-400 hover:text-white transition">
            My Reports
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-black mb-3">Report an Issue</h1>
        <p className="text-slate-400 mb-8 text-lg">Describe the problem and our AI will classify and route it automatically.</p>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-4 rounded-xl mb-6 flex items-center gap-3 font-medium">
            <span className="text-xl">✅</span> Report submitted successfully! AI is analyzing it now. Redirecting...
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-4 rounded-xl mb-6 font-medium">
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 block">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition focus:ring-1 focus:ring-emerald-500"
                    placeholder="Brief title of the issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 block">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 block">Photo Evidence</label>
              {!photoPreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-slate-800/50 transition group"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition">
                    <Upload size={24} />
                  </div>
                  <p className="text-slate-300 font-medium">Click to upload photo</p>
                  <p className="text-slate-500 text-sm mt-1">PNG, JPG up to 10MB</p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 inline-block">
                    <img src={photoPreview} alt="Preview" className="h-48 object-cover" />
                    <button 
                        type="button" 
                        onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-md transition"
                    >
                        <X size={16} />
                    </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoChange} 
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 block">Exact Location</label>
                  <p className="text-xs text-slate-500 mb-2">Click on the map to pin the exact location, or type it below.</p>
                  <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-slate-700 z-0">
                    <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                  </div>
              </div>

              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. 123 Main Street near City Hall"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition focus:ring-1 focus:ring-emerald-500 resize-none"
                placeholder="Describe the problem in detail. Our AI will analyze this to determine severity and department routing..."
                required
              />
            </div>

            <div className="pt-2">
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition text-lg shadow-lg shadow-emerald-500/20"
                >
                <Send size={20} />
                {loading ? 'Analyzing & Submitting...' : 'Submit Report'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}