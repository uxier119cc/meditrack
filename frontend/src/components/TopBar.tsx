
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface TopBarProps {
  doctorName: string;
  initials: string;
}

const TopBar: React.FC<TopBarProps> = ({ doctorName, initials }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('meditrack-auth');
    localStorage.removeItem('meditrack-doctor');
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account"
    });
    
    navigate('/login');
  };
  
  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">
          Welcome, <span className="text-primary">Dr. {doctorName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">MediTrack Clinical Management System</p>
      </div>
      
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </Button>
        
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground border border-primary/20 flex items-center justify-center font-semibold">
          {initials}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
