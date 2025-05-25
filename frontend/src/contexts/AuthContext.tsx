import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { authService, chatbotService } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  // Chatbot functions
  sendChatMessage: (message: string, conversationId?: string, context?: string) => Promise<any>;
  getChatHistory: (conversationId: string) => Promise<any>;
  clearChatHistory: (conversationId: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkUserAuth = async () => {
      await checkAuth();
      setLoading(false);
    };
    
    checkUserAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('meditrack-token');
      console.log('AuthContext: Checking authentication, token exists:', !!token);
      
      if (!token) {
        console.log('AuthContext: No token found, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      // Fetch user profile
      console.log('AuthContext: Token found, fetching user profile');
      const userData = await authService.getProfile();
      console.log('AuthContext: User profile fetched successfully:', userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('AuthContext: Authentication check failed:', error);
      
      // Clear auth data on error
      localStorage.removeItem('meditrack-auth');
      localStorage.removeItem('meditrack-token');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      setLoading(true);
      console.log('AuthContext: Attempting login with:', email);
      
      const response = await authService.login(email, password);
      console.log('AuthContext: Login successful, response:', response);
      
      // Store auth data
      localStorage.setItem('meditrack-auth', 'true');
      localStorage.setItem('meditrack-token', response.token);
      localStorage.setItem('meditrack-doctor', response.name || 'Doctor');
      
      if (rememberMe) {
        localStorage.setItem('meditrack-remember', 'true');
        localStorage.setItem('meditrack-email', email);
      } else {
        localStorage.removeItem('meditrack-remember');
        localStorage.removeItem('meditrack-email');
      }
      
      setUser(response);
      setIsAuthenticated(true);
      navigate('/');
      
      toast({
        title: "Login successful",
        description: "Welcome back to MediTrack",
      });
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      // Show appropriate error message based on the error
      let errorMessage = "Please check your credentials and try again";
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to the server. Please check your connection.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('meditrack-auth');
    localStorage.removeItem('meditrack-token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // Chatbot functions
  const sendChatMessage = async (message: string, conversationId?: string, context?: string) => {
    try {
      return await chatbotService.sendMessage(message, conversationId, context);
    } catch (error) {
      console.error('AuthContext: Error sending chat message:', error);
      throw error;
    }
  };

  const getChatHistory = async (conversationId: string) => {
    try {
      return await chatbotService.getConversationHistory(conversationId);
    } catch (error) {
      console.error('AuthContext: Error getting chat history:', error);
      throw error;
    }
  };

  const clearChatHistory = async (conversationId: string) => {
    try {
      return await chatbotService.clearConversation(conversationId);
    } catch (error) {
      console.error('AuthContext: Error clearing chat history:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading, 
      login, 
      logout,
      checkAuth,
      // Chatbot functions
      sendChatMessage,
      getChatHistory,
      clearChatHistory
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
