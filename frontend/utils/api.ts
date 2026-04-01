import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://supreme-sop-gen.preview.emergentagent.com';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for AI generation
});

// Auth
export const login = async (identifier: string, pin: string) => {
  const response = await api.post('/auth/login', { identifier, pin });
  return response.data;
};

export const registerUser = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

// Categories
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

// Dashboard
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Documents
export const getDocuments = async (params?: { category?: string; status?: string; search?: string }) => {
  const response = await api.get('/documents', { params });
  return response.data;
};

export const getDocument = async (id: string) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const createDocument = async (data: any) => {
  const response = await api.post('/documents', data);
  return response.data;
};

export const updateDocument = async (id: string, data: any) => {
  const response = await api.put(`/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id: string) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

// AI Generation
export const generateDocument = async (data: {
  category: string;
  document_type: string;
  title: string;
  site_name?: string;
  specific_requirements?: string;
  sections_count?: number;
}) => {
  const response = await api.post('/documents/generate', data);
  return response.data;
};

// Templates
export const getTemplates = async (category?: string) => {
  const response = await api.get('/templates', { params: category ? { category } : {} });
  return response.data;
};

export const createTemplate = async (data: any) => {
  const response = await api.post('/templates', data);
  return response.data;
};

export const updateTemplate = async (id: string, data: any) => {
  const response = await api.put(`/templates/${id}`, data);
  return response.data;
};

export const deleteTemplate = async (id: string) => {
  const response = await api.delete(`/templates/${id}`);
  return response.data;
};

// Sites
export const getSites = async () => {
  const response = await api.get('/sites');
  return response.data;
};

// Export document HTML
export const getDocumentExportUrl = (id: string) => {
  return `${API_URL}/api/documents/${id}/export`;
};
