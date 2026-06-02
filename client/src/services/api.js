import axios from 'axios'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

export const reportsAPI = {
  create: (data) => api.post('/reports/', data),
  getMine: () => api.get('/reports/'),
  getOne: (id) => api.get(`/reports/${id}`),
}

export const adminAPI = {
  getAllReports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.put(`/admin/reports/${id}`, data),
  getSummary: () => api.get('/analytics/summary'),
  getDepartments: () => api.get('/admin/departments'),
}

export const chatbotAPI = {
  sendMessage: (message, history) => api.post('/chatbot', { message, history }),
}

export default api