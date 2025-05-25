import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  XCircle,
  Users,
  Clock,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { nurseService } from '@/lib/api';

const NurseManagement = () => {
  // Available departments and roles for dropdown
  const departments = ['General Medicine', 'Pediatrics', 'Emergency', 'Cardiology', 'Orthopedics', 'Neurology'];
  const roles = ['Head Nurse', 'Staff Nurse', 'Junior Nurse'];
  
  const [nurseSearchTerm, setNurseSearchTerm] = useState('');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [allNurses, setAllNurses] = useState([]);
  const [filteredNurses, setFilteredNurses] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('nurses');
  const [isLoading, setIsLoading] = useState(true);
  const [addNurseOpen, setAddNurseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New nurse form state
  const [newNurse, setNewNurse] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    status: 'Active'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
  });

  // Fetch nurses from the API
  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setIsLoading(true);
        const response = await nurseService.getAllNurses();
        console.log('API Response:', response);

        // Transform the API data to match the expected format
        const transformedNurses = response
          .map(nurse => ({
            id: nurse.nurseId,
            name: nurse.name,
            email: nurse.email,
            role: nurse.role,
            department: nurse.department,
            status: nurse.status || 'Active',
            joinDate: new Date(nurse.joinDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          }))
          .sort((a, b) => {
            // Extract numbers from nurseId (e.g., "N0001" -> 1)
            const aNum = parseInt(a.id.replace(/\D/g, ''));
            const bNum = parseInt(b.id.replace(/\D/g, ''));
            return aNum - bNum;
          });

        console.log('Transformed Nurses:', transformedNurses);
        setAllNurses(transformedNurses);
        setFilteredNurses(transformedNurses);
      } catch (err) {
        console.error('Error fetching nurses:', err);
        toast({
          title: "Error loading nurses",
          description: "There was a problem fetching nurse data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNurses();
  }, []);

  const handleStatusChange = async (nurseId: string, newStatus: string) => {
    setIsLoading(true);
    
    try {
      // Ensure consistent case for status (moved normalization to the API service)
      const statusValue = newStatus === 'Active' ? 'Active' : 'Inactive';
      
      // Make API call to update nurse status using the specific status endpoint
      const response = await nurseService.updateNurseStatus(nurseId, statusValue);
      console.log('Updated nurse status:', response);

      // Get the actual returned status from the API response to ensure consistency
      const updatedStatus = response.status || statusValue;

      // Update local state with the returned data
      setAllNurses(prev => 
        prev.map(nurse => 
          nurse.id === nurseId ? { ...nurse, status: updatedStatus } : nurse
        )
      );
      setFilteredNurses(prev => 
        prev.map(nurse => 
          nurse.id === nurseId ? { ...nurse, status: updatedStatus } : nurse
        )
      );
      
      toast({
        title: "Status updated",
        description: `Nurse status has been changed to ${updatedStatus}`,
        variant: updatedStatus === 'Active' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error updating nurse status:', error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the nurse's status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNurseSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setNurseSearchTerm(term);
    
    setIsLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      if (!term) {
        setFilteredNurses(allNurses);
      } else {
        const filtered = allNurses.filter(
          nurse => 
            nurse.name.toLowerCase().includes(term) ||
            nurse.id.toLowerCase().includes(term) ||
            nurse.email.toLowerCase().includes(term) ||
            nurse.role.toLowerCase().includes(term) ||
            nurse.department.toLowerCase().includes(term)
        );
        setFilteredNurses(filtered);
      }
      setIsLoading(false);
    }, 300);
  };
  
  const handleActivitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setActivitySearchTerm(term);
    
    setIsLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      if (!term) {
        setFilteredActivities(activityLogs);
      } else {
        const filtered = activityLogs.filter(
          log => 
            log.user.toLowerCase().includes(term) ||
            log.action.toLowerCase().includes(term) ||
            log.patient.toLowerCase().includes(term)
        );
        setFilteredActivities(filtered);
      }
      setIsLoading(false);
    }, 300);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsLoading(true);
    
    // Simulate tab change loading
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };
  
  const handleDeleteNurse = async (nurseId: string) => {
    setIsLoading(true);
    
    try {
      // Make API call to delete nurse
      await nurseService.deleteNurse(nurseId);
      
      // Update local state
      const nurseToDelete = filteredNurses.find(nurse => nurse.id === nurseId);
      setAllNurses(prev => prev.filter(nurse => nurse.id !== nurseId));
      setFilteredNurses(prev => prev.filter(nurse => nurse.id !== nurseId));
      
      toast({
        title: "Nurse removed",
        description: `${nurseToDelete?.name} has been successfully removed from the system`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting nurse:', error);
      toast({
        title: "Error removing nurse",
        description: "There was a problem removing the nurse. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewNurse(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (value: string, field: string) => {
    setNewNurse(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when selecting
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      password: '',
      role: '',
      department: '',
    };
    let isValid = true;
    
    if (!newNurse.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    if (!newNurse.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(newNurse.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!newNurse.password.trim()) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (newNurse.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newNurse.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      isValid = false;
    }
    
    if (!newNurse.role) {
      errors.role = 'Role is required';
      isValid = false;
    }
    
    if (!newNurse.department) {
      errors.department = 'Department is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleAddNurse = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare nurse data including password
      const nurseData = {
        name: newNurse.name,
        email: newNurse.email,
        password: newNurse.password,
        role: newNurse.role,
        department: newNurse.department,
        status: newNurse.status
      };

      // Make API call to add nurse
      const response = await nurseService.createNurse(nurseData);
      console.log('Added nurse:', response);

      // Add to nurses list with the returned data
      const newNurseWithId = {
        id: response.nurseId,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department,
        status: response.status,
        joinDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      };

      setAllNurses(prev => [newNurseWithId, ...prev]);
      setFilteredNurses(prev => [newNurseWithId, ...prev]);
      
      // Show success toast
      toast({
        title: "Nurse added",
        description: `${newNurse.name} has been successfully added to the system`,
        variant: "default",
      });
      
      // Reset form and close modal
      setNewNurse({
        name: '',
        email: '',
        password: '',
        role: '',
        department: '',
        status: 'Active'
      });
      
      setIsSubmitting(false);
      setAddNurseOpen(false);
    } catch (error) {
      console.error('Error adding nurse:', error);
      toast({
        title: "Error adding nurse",
        description: "There was a problem adding the nurse. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  // Form transition variants
  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1 
      }
    }
  };
  
  const formItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <div className="space-y-6">
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nurse Management</h1>
          <p className="text-muted-foreground">Manage nurse access credentials and monitor activity</p>
        </div>
        
        <Button 
          className="gap-2 bg-clinical-600 hover:bg-clinical-700 transition-all duration-300 shadow-md hover:shadow-lg"
          onClick={() => setAddNurseOpen(true)}
        >
          <UserPlus size={16} />
          Add New Nurse
        </Button>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Total Nurses" 
            value={filteredNurses.length.toString()} 
            icon={<Users className="h-5 w-5 text-clinical-600" />} 
            color="bg-clinical-100"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Active Nurses" 
            value={filteredNurses.filter(nurse => nurse.status === 'Active').length.toString()} 
            icon={<CheckCircle2 className="h-5 w-5 text-status-success" />} 
            color="bg-green-100"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Recent Activities" 
            value={filteredActivities.length.toString()}
            icon={<Clock className="h-5 w-5 text-amber-600" />} 
            color="bg-amber-100"
          />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Tabs defaultValue="nurses" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="nurses">Nurses</TabsTrigger>
            <TabsTrigger value="activityLog">Activity Log</TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="nurses">
                <motion.div 
                  className="medi-card overflow-hidden shadow-md rounded-lg border border-border"
                  whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-clinical-100 text-clinical-600 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <h2 className="text-lg font-medium">Nursing Staff</h2>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          placeholder="Search nurses..." 
                          className="pl-9 w-[300px] focus:ring-clinical-600"
                          value={nurseSearchTerm}
                          onChange={handleNurseSearch}
                        />
                      </div>
                      
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center p-16 text-center">
                        <Loader2 size={40} className="text-clinical-600 animate-spin mb-4" />
                        <h3 className="text-lg font-medium">Loading data...</h3>
                        <p className="text-muted-foreground mt-1">Please wait while we fetch the latest information</p>
                      </div>
                    ) : filteredNurses.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-slate-50">
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Department</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Join Date</th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {filteredNurses.map((nurse, index) => (
                              <motion.tr 
                                key={nurse.id} 
                                className="table-row-hover border-b border-border last:border-0 hover:bg-slate-50 transition-colors duration-150"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                              >
                                <td className="p-4 text-sm">{nurse.id}</td>
                                <td className="p-4 text-sm font-medium">{nurse.name}</td>
                                <td className="p-4 text-sm">{nurse.email}</td>
                                <td className="p-4 text-sm">{nurse.role}</td>
                                <td className="p-4 text-sm">{nurse.department}</td>
                                <td className="p-4 text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    nurse.status === 'Active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {nurse.status === 'Active' ? (
                                      <CheckCircle2 size={12} className="mr-1" />
                                    ) : (
                                      <XCircle size={12} className="mr-1" />
                                    )}
                                    {nurse.status}
                                  </span>
                                </td>
                                <td className="p-4 text-sm">{nurse.joinDate}</td>
                                <td className="p-4 text-sm text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    {nurse.status === 'Active' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all duration-150"
                                        onClick={() => handleStatusChange(nurse.id, 'Inactive')}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <>
                                            <XCircle size={14} className="mr-1" />
                                            Deactivate
                                          </>
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-800 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-150"
                                        onClick={() => handleStatusChange(nurse.id, 'Active')}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <>
                                            <CheckCircle2 size={14} className="mr-1" />
                                            Activate
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    
                                    {/* <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal size={16} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="cursor-pointer">
                                          <Edit size={14} className="mr-2" />
                                          Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="cursor-pointer text-red-600 focus:text-red-600"
                                          onClick={() => handleDeleteNurse(nurse.id)}
                                        >
                                          <Trash2 size={14} className="mr-2" />
                                          Remove Nurse
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu> */}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    ) : (
                      <motion.div 
                        className="flex flex-col items-center justify-center p-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Users size={24} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No nurses found</h3>
                        <p className="text-muted-foreground mt-1">Try adjusting your search terms</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </motion.div>
            
            <motion.div
              key={activeTab === 'activityLog' ? 'activity' : 'nurses'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="activityLog">
                <motion.div 
                  className="medi-card overflow-hidden shadow-md rounded-lg border border-border"
                  whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <h2 className="text-lg font-medium">Activity Log</h2>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          placeholder="Search activities..." 
                          className="pl-9 w-[300px] focus:ring-amber-600"
                          value={activitySearchTerm}
                          onChange={handleActivitySearch}
                        />
                      </div>
                      
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center p-16 text-center">
                        <Loader2 size={40} className="text-amber-600 animate-spin mb-4" />
                        <h3 className="text-lg font-medium">Loading activity log...</h3>
                        <p className="text-muted-foreground mt-1">Please wait while we fetch the latest activities</p>
                      </div>
                    ) : filteredActivities.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-slate-50">
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Patient</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {filteredActivities.map((log, index) => (
                              <motion.tr 
                                key={log.id} 
                                className="table-row-hover border-b border-border last:border-0 hover:bg-slate-50 transition-colors duration-150"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                              >
                                <td className="p-4 text-sm">{log.id}</td>
                                <td className="p-4 text-sm font-medium">{log.user}</td>
                                <td className="p-4 text-sm">{log.action}</td>
                                <td className="p-4 text-sm">{log.patient}</td>
                                <td className="p-4 text-sm">{log.time}</td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    ) : (
                      <motion.div 
                        className="flex flex-col items-center justify-center p-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Clock size={24} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No activities found</h3>
                        <p className="text-muted-foreground mt-1">Try adjusting your search terms</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
      
      {/* Add Nurse Dialog */}
      <Dialog open={addNurseOpen} onOpenChange={setAddNurseOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Nurse</DialogTitle>
            <DialogDescription>
              Fill in the nurse details below to add them to the system.
            </DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="grid gap-4 py-4"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="grid gap-2" variants={formItemVariants}>
              <Label htmlFor="name" className="text-sm">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter full name"
                value={newNurse.name}
                onChange={handleInputChange}
                className={formErrors.name ? "border-red-300 focus:ring-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </motion.div>
            
            <motion.div className="grid gap-2" variants={formItemVariants}>
              <Label htmlFor="email" className="text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={newNurse.email}
                onChange={handleInputChange}
                className={formErrors.email ? "border-red-300 focus:ring-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
              )}
            </motion.div>

            <motion.div className="grid gap-2" variants={formItemVariants}>
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={newNurse.password}
                onChange={handleInputChange}
                className={formErrors.password ? "border-red-300 focus:ring-red-500" : ""}
              />
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
              )}
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div className="grid gap-2" variants={formItemVariants}>
                <Label htmlFor="role" className="text-sm">
                  Role
                </Label>
                <Select 
                  value={newNurse.role} 
                  onValueChange={(value) => handleSelectChange(value, 'role')}
                >
                  <SelectTrigger id="role" className={formErrors.role ? "border-red-300 focus:ring-red-500" : ""}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>
                )}
              </motion.div>
              
              <motion.div className="grid gap-2" variants={formItemVariants}>
                <Label htmlFor="department" className="text-sm">
                  Department
                </Label>
                <Select 
                  value={newNurse.department} 
                  onValueChange={(value) => handleSelectChange(value, 'department')}
                >
                  <SelectTrigger id="department" className={formErrors.department ? "border-red-300 focus:ring-red-500" : ""}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.department && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.department}</p>
                )}
              </motion.div>
            </div>
            
            <motion.div className="grid gap-2" variants={formItemVariants}>
              <Label htmlFor="status" className="text-sm">
                Status
              </Label>
              <Select 
                value={newNurse.status} 
                onValueChange={(value) => handleSelectChange(value, 'status')}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </motion.div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNurseOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddNurse} 
              className="gap-2 bg-clinical-600 hover:bg-clinical-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Add Nurse
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  return (
    <motion.div 
      className="rounded-lg border border-border p-4 shadow-sm bg-white"
      whileHover={{ y: -5, boxShadow: "0 12px 20px -8px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
      </div>
    </motion.div>
  );
};

export default NurseManagement;