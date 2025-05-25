import axios from 'axios';

// Define the API base URL
const API_URL = 'http://localhost:5000/api';
console.log('Using API URL:', API_URL);
// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false, // Set to false to avoid CORS preflight issues
  timeout: 10000 // Add timeout to prevent hanging requests
});

// Log the API URL for debugging
console.log('API URL being used:', API_URL);

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('meditrack-token');
    
    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests in development
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, { 
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    console.log(`✅ API Response: ${response.status}`, { 
      data: response.data,
      config: response.config
    });
    return response;
  },
  (error) => {
    // Log error responses in development
    console.error(`❌ API Error: ${error.response?.status || 'Network Error'}`, {
      message: error.response?.data?.message || error.message,
      config: error.config
    });
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('meditrack-auth');
      localStorage.removeItem('meditrack-token');
      window.location.href = '/login';
    } else if (error.code === 'ERR_NETWORK') {
      // Handle network errors (server not running)
      console.error('Network error - server may be down');
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Patient services
export const patientService = {
  getAllPatients: async () => {
    const response = await api.get('/patients');
    return response.data;
  },
  getPatient: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  createPatient: async (patientData: any) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },
  updatePatient: async (id: string, patientData: any) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },
  deletePatient: async (id: string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
};

// Prescription services
export const prescriptionService = {
  createPrescription: async (prescriptionData: any) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },
  
  getPrescription: async (id: string) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },
  
  getPatientPrescriptions: async (patientId: string) => {
    const response = await api.get(`/prescriptions/patient/${patientId}`);
    return response.data;
  },

  updatePrescription: async (id: string, prescriptionData: any) => {
    const response = await api.put(`/prescriptions/${id}`, prescriptionData);
    return response.data;
  },
  
  downloadPrescriptionPDF: async (id: string) => {
    try {
      // Set up for direct file download instead of JSON response
      const response = await axios({
        url: `${API_URL}/prescriptions/${id}/download`,
        method: 'GET',
        responseType: 'blob', // Important for binary content
        timeout: 30000 // Longer timeout for PDF generation
      });
      
      // Create a URL for the blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${id}.pdf`);
      document.body.appendChild(link);
      
      // Click the link and remove it
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading prescription PDF:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Lab report services
export const labReportService = {
  getAllLabReports: async () => {
    const response = await api.get('/lab-reports');
    return response.data;
  },
  
  getLabReport: async (id: string) => {
    const response = await api.get(`/lab-reports/${id}`);
    return response.data;
  },
  
  getPatientLabReports: async (patientId: string) => {
    const response = await api.get(`/lab-reports/patient/${patientId}`);
    return response.data;
  },
  
  createLabReport: async (labReportData: any) => {
    const response = await api.post('/lab-reports', labReportData);
    return response.data;
  },
  
  updateLabReport: async (id: string, labReportData: any) => {
    const response = await api.put(`/lab-reports/${id}`, labReportData);
    return response.data;
  },
  
  deleteLabReport: async (id: string) => {
    const response = await api.delete(`/lab-reports/${id}`);
    return response.data;
  },
  
  downloadLabReportPDF: async (reportId: string): Promise<Blob> => {
    if (!reportId || reportId === 'undefined') {
      throw new Error('Invalid report ID');
    }
    
    // Get authentication token
    const token = localStorage.getItem('meditrack-token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Use fetch directly with proper authentication headers
    const response = await fetch(`${API_URL}/lab-reports/${reportId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Log response for debugging
    console.log('Lab report download response:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to download lab report: ${response.status} ${response.statusText}`);
    }
    
    return response.blob();
  },
};

// Nurse services
export const nurseService = {
  getAllNurses: async () => {
    const response = await api.get('/nurses');
    return response.data;
  },
  getNurse: async (id: string) => {
    const response = await api.get(`/nurses/${id}`);
    return response.data;
  },
  createNurse: async (nurseData: any) => {
    const response = await api.post('/nurses', nurseData);
    return response.data;
  },
  updateNurse: async (id: string, nurseData: any) => {
    const response = await api.put(`/nurses/${id}`, nurseData);
    return response.data;
  },
  updateNurseStatus: async (id: string, status: string) => {
    // Normalize status to ensure consistent capitalization before sending to backend
    const normalizedStatus = status === 'active' || status === 'Active' ? 'Active' : 'Inactive';
    const response = await api.put(`/nurses/${id}/status`, { status: normalizedStatus });
    return response.data;
  },
  deleteNurse: async (id: string) => {
    const response = await api.delete(`/nurses/${id}`);
    return response.data;
  },
};

// Prescription suggestion service
export const suggestionService = {
  getPrescriptionSuggestions: async (query: string) => {
    try {
      // Add timeout to prevent long-running requests
      const response = await api.get('/suggestions/prescription/fallback', {
        params: { query },
        timeout: 3000 // 3 second timeout
      });
      
      // Return the data even if it doesn't match the expected structure
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      console.error('Error fetching prescription suggestions:', error);
      
      // Return empty array instead of throwing to prevent component crashes
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Chatbot service
export const chatbotService = {
  sendMessage: async (message: string, conversationId?: string, context?: string) => {
    try {
      const response = await api.post('/chatbot/chat', {
        message,
        conversationId,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },
  getConversationHistory: async (conversationId: string) => {
    try {
      const response = await api.get(`/chatbot/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  },
  clearConversation: async (conversationId: string) => {
    try {
      const response = await api.delete(`/chatbot/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      throw error;
    }
  }
};

export default api;
