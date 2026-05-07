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

// ==================== Token 字段映射 ====================
// 前端 camelCase → 数据库 snake_case（与后端保持一致）
const TOKEN_FIELD_MAP = {
  id: 'id', name: 'name', token: 'token',
  wsUrl: 'ws_url', server: 'server', remark: 'remark',
  level: 'level', profession: 'profession', avatar: 'avatar',
  isActive: 'enabled', importMethod: 'import_method',
  sourceUrl: 'source_url', settings: 'settings',
  lastUsed: 'last_used', lastRefreshed: 'last_refreshed',
  createdAt: 'created_at', updatedAt: 'updated_at',
  upgradedToPermanent: 'upgraded_to_permanent', upgradedAt: 'upgraded_at'
}

// 前端发送时转换字段名
function mapTokenToSnakeCase(data) {
  const result = {}
  for (const [camelKey, snakeKey] of Object.entries(TOKEN_FIELD_MAP)) {
    if (data[camelKey] !== undefined) {
      result[snakeKey] = data[camelKey]
    }
  }
  return result
}

// 后端返回时转换字段名（snake_case → camelCase）
function mapTokenFromSnakeCase(row) {
  if (!row) return row
  const reverseMap = Object.fromEntries(
    Object.entries(TOKEN_FIELD_MAP).map(([k, v]) => [v, k])
  )
  const result = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = reverseMap[key] || key
    result[camelKey] = value
  }
  return result
}

// ==================== Token API ====================
export const tokenApi = {
  getAll: async () => {
    const data = await api.get('/api/tokens')
    return Array.isArray(data) ? data.map(mapTokenFromSnakeCase) : data
  },
  list: async () => {
    const data = await api.get('/api/tokens')
    return Array.isArray(data) ? data.map(mapTokenFromSnakeCase) : data
  },
  create: async (data) => {
    // 发送前转换为 snake_case，确保兼容后端有无字段映射逻辑
    return api.post('/api/tokens', mapTokenToSnakeCase(data))
  },
  update: async (id, data) => {
    return api.patch(`/api/tokens/${id}`, mapTokenToSnakeCase(data))
  },
  delete: (id) => api.delete(`/api/tokens/${id}`),
  batchImport: (tokens) => Promise.all(tokens.map(t => api.post('/api/tokens', mapTokenToSnakeCase(t))))
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
  listFromDb: (limit = 100) => api.get(`/api/logs/db?limit=${limit}`),
  summary: (limit = 500) => api.get(`/api/logs/summary?limit=${limit}`)
}

// ==================== Health ====================
export const healthApi = {
  check: () => api.get('/health')
}

export default api
