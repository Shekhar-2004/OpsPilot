import axios from 'axios';

let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Automatically append /api/v1 if the provided URL is a base domain (e.g. misses the route path)
if (API_BASE && !API_BASE.endsWith('/api/v1') && !API_BASE.endsWith('/api/v1/')) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('opspilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified API services
export const authService = {
  signup: async (name, email, role, password) => {
    const response = await api.post('/auth/signup', { name, email, role, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login/json', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('opspilot_token', response.data.access_token);
      localStorage.setItem('opspilot_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
  }
};

export const teamService = {
  list: async () => {
    const response = await api.get('/teams/');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },
  create: async (name, description) => {
    const response = await api.post('/teams/', { name, description });
    return response.data;
  },
  addMember: async (teamId, email) => {
    const response = await api.post(`/teams/${teamId}/members`, { email });
    return response.data;
  }
};

export const taskService = {
  list: async (filters = {}) => {
    const response = await api.get('/tasks/', { params: filters });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  create: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },
  update: async (id, updateData) => {
    const response = await api.put(`/tasks/${id}`, updateData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};

export const docService = {
  list: async () => {
    const response = await api.get('/docs/');
    return response.data;
  },
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/docs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  uploadText: async (fileName, content) => {
    const formData = new FormData();
    formData.append('file_name', fileName);
    formData.append('content', content);
    const response = await api.post('/docs/text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/docs/${id}`);
    return response.data;
  }
};

export const queryService = {
  ask: async (query, teamId = null) => {
    const response = await api.post('/query/', { query, team_id: teamId });
    return response.data;
  }
};

export default api;
