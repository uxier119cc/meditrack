
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ActivitySquare, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Sidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('meditrack-auth');
    localStorage.removeItem('meditrack-doctor');
    
    // Show logout toast
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    
    // Navigate to login page
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-border">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <svg 
              className="h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 2a3 3 0 0 1 2.995 2.824L21 5v14a3 3 0 0 1-2.824 2.995L18 22H6a3 3 0 0 1-2.995-2.824L3 19V5a3 3 0 0 1 2.824-2.995L6 2h12zm-3 14H9v2h6v-2zm0-4H9v2h6v-2zm0-4H9v2h6V8zm4-4H5v14h14V4z"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-sidebar-foreground">MediTrack</span>
        </div>
        
        <div className="space-y-1">
          <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarLink to="/nurse-management" icon={<ActivitySquare size={18} />} label="Nurse Management" />
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <button 
          className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors w-full px-3 py-2 rounded-md"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          isActive 
            ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default Sidebar;
