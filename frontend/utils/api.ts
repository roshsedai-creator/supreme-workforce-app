import axios from 'axios';

// For standalone APK, use the production backend URL
// This URL is the permanent backend for the Supreme Workforce app
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://timewizard-12.preview.emergentagent.com';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Auth
export const login = async (identifier: string, pin: string) => {
  const response = await api.post('/auth/login', { identifier, pin });
  return response.data;
};

// Users
export const getUsers = async (role?: string, site_id?: string) => {
  const params: any = {};
  if (role) params.role = role;
  if (site_id) params.site_id = site_id;
  const response = await api.get('/users', { params });
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await api.post('/users', userData);
  return response.data;
};

// Sites
export const getSites = async () => {
  const response = await api.get('/sites');
  return response.data;
};

export const createSite = async (siteData: any) => {
  const response = await api.post('/sites', siteData);
  return response.data;
};

// Timesheets
export const clockIn = async (employee_id: string, site_id: string, gps_lat: number, gps_long: number) => {
  // Format local time WITHOUT converting to UTC
  // This gives the actual time on the user's phone
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const localTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  
  console.log('Clock-in local time:', localTime);
  
  const response = await api.post('/timesheets/clock-in', {
    employee_id,
    site_id,
    gps_lat,
    gps_long,
    local_timestamp: localTime,
  });
  return response.data;
};

export const clockOut = async (timesheet_id: string, gps_lat: number, gps_long: number) => {
  // Format local time WITHOUT converting to UTC
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const localTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  
  console.log('Clock-out local time:', localTime);
  
  const response = await api.post('/timesheets/clock-out', {
    timesheet_id,
    gps_lat,
    gps_long,
    local_timestamp: localTime,
  });
  return response.data;
};

export const manageBreak = async (timesheet_id: string, action: 'start' | 'end') => {
  const response = await api.post('/timesheets/break', {
    timesheet_id,
    action,
  });
  return response.data;
};

export const getTimesheets = async (employee_id?: string, site_id?: string, approval_status?: string) => {
  const params: any = {};
  if (employee_id) params.employee_id = employee_id;
  if (site_id) params.site_id = site_id;
  if (approval_status) params.approval_status = approval_status;
  const response = await api.get('/timesheets', { params });
  return response.data;
};

export const approveTimesheet = async (timesheet_id: string, supervisor_id: string, status: string, notes?: string, signature?: string) => {
  const response = await api.post('/timesheets/approve', {
    timesheet_id,
    supervisor_id,
    status,
    notes,
    signature,
  });
  return response.data;
};

// Dashboard
export const getSupervisorDashboard = async (site_id?: string) => {
  const params: any = {};
  if (site_id) params.site_id = site_id;
  const response = await api.get('/dashboard/supervisor', { params });
  return response.data;
};

// Shifts
export const getShifts = async (employee_id?: string, site_id?: string, status?: string) => {
  const params: any = {};
  if (employee_id) params.employee_id = employee_id;
  if (site_id) params.site_id = site_id;
  if (status) params.status = status;
  const response = await api.get('/shifts', { params });
  return response.data;
};

export const createShift = async (shiftData: any) => {
  const response = await api.post('/shifts', shiftData);
  return response.data;
};

// Timesheet Updates
export const updateTimesheet = async (
  timesheet_id: string, 
  data: {
    employee_notes?: string;
    photo_base64?: string;
    manual_clock_in?: string;
    manual_clock_out?: string;
    manual_break_minutes?: number;
  }
) => {
  const response = await api.post(`/timesheets/${timesheet_id}/update`, data);
  return response.data;
};

export const deleteTimesheet = async (timesheet_id: string) => {
  const response = await api.delete(`/timesheets/${timesheet_id}`);
  return response.data;
};
