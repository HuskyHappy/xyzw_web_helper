/**
 * 统一 API 请求封装
 * 后端地址：https://xyzw-backend-jgj7.onrender.com
 */
import axios from 'axios'

const API_BASE = 'https://xyzw-backend-jgj7.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  (response) => (response.data?.data !== undefined ? response.data.data : response.data),
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || error)
  }
)

// ==================== Token API ====================
export const tokenApi = {
  getAll: () => api.get('/api/tokens'),
  list: () => api.get('/api/tokens'),
  create: (data) => api.post('/api/tokens', data),
  update: (id, data) => api.patch(`/api/tokens/${id}`, data),
  delete: (id) => api.delete(`/api/tokens/${id}`),
  batchImport: (tokens) => Promise.all(tokens.map(t => api.post('/api/tokens', t)))
}

// ==================== Task API ====================
export const taskApi = {
  list: () => api.get('/api/tasks'),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.patch(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  run: (id) => api.post(`/api/tasks/${id}/run`),
  getDefinitions: () => api.get('/api/task-definitions')
}

// ==================== Template API ====================
export const templateApi = {
  list: () => api.get('/api/templates'),
  create: (data) => api.post('/api/templates', data),
  update: (id, data) => api.patch(`/api/templates/${id}`, data),
  delete: (id) => api.delete(`/api/templates/${id}`)
}

// ==================== Settings API ====================
export const settingsApi = {
  get: (key) => api.get(`/api/settings/${key}`),
  save: (key, value) => api.post(`/api/settings/${key}`, { value }),
  getMerged: () => api.get('/api/settings/merged')
}

// ==================== Log API ====================
export const logApi = {
  list: (limit = 100) => api.get(`/api/logs?limit=${limit}`),
  listFromDb: (limit = 100) => api.get(`/api/logs/db?limit=${limit}`)
}

// ==================== Health ====================
export const healthApi = {
  check: () => api.get('/health')
}

export default api
