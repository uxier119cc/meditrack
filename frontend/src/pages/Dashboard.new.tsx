import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar,
  Clock,
  Search,
  PieChart,
  ChevronRight,
  ChevronDown,
  Activity,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientWaitingList from '@/components/PatientWaitingList';
import PatientDirectory from '@/components/PatientDirectory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { getAllPatients } from '@/utils/patientData';
import { patientService } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { auth } from '@/firebase';

// StatCard component for displaying statistics
const StatCard = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <motion.div 
        className="h-2 w-full flex rounded-full overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.5 }}
      >
        {data.map((item, index) => (
          <motion.div 
            key={index} 
            className={`${item.color}`} 
            style={{ width: `${item.value}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${item.value}%` }}
            transition={{ duration: 0.5, delay: 0.2 * index }}
          />
        ))}
      </motion.div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((item, index) => (
          <motion.div 
            key={index} 
            className="flex items-center text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + (0.1 * index) }}
          >
            <span className={`${item.color} h-2 w-2 rounded-full mr-1`}></span>
            {item.label}: {item.value}%
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  // State variables
  const [allPatients, setAllPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDemographics, setShowDemographics] = useState(false);
  const [activeTab, setActiveTab] = useState("waiting");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);
  const [viewingPatientDetails, setViewingPatientDetails] = useState(false);
  const [todayVisits, setTodayVisits] = useState([]);

  // Update time every second for a real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Fetch patients from the API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await patientService.getAllPatients();
        console.log('API Response:', response); // Debug log
        
        // Transform the API data to match the expected format
        const transformedPatients = response.map(patient => ({
          id: patient.patientId,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.contact,
          email: patient.email || '', 
          address: patient.address,
          reason: patient.visits[0]?.chiefComplaint || '',
          lastVisit: patient.visits[0]?.date ? new Date(patient.visits[0].date).toLocaleDateString() : 'No visits',
          bloodType: patient.bloodGroup || '', 
          allergies: [],
          medicalHistory: [patient.medicalHistory],
          visits: patient.visits.map(visit => ({
            date: visit.date,
            complaint: visit.chiefComplaint,
            vitals: {
              bloodPressure: visit.BP,
              temperature: visit.temperature,
              heartRate: visit.heartRate
            }
          }))
        }));

        console.log('Transformed Patients:', transformedPatients); // Debug log
        setAllPatients(transformedPatients);
        setFilteredPatients(transformedPatients);
        setLoading(false);
      } catch (err) {
        console.error('Error details:', err); // Debug log
        setError('Failed to fetch patients');
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);
  
  // Filter patients with visits today for the waiting list
  useEffect(() => {
    if (allPatients.length > 0) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Filter patients who have visits today
      const patientsWithTodayVisits = allPatients.filter(patient => {
        return patient.visits && patient.visits.some(visit => {
          // Check if the visit date is today
          const visitDate = new Date(visit.date).toISOString().split('T')[0];
          return visitDate === today;
        });
      });
      
      // Sort by visit time (first come first serve)
      patientsWithTodayVisits.sort((a, b) => {
        const today = new Date().toISOString().split('T')[0];
        
        const aVisitTime = new Date(a.visits.find(v => 
          new Date(v.date).toISOString().split('T')[0] === today
        )?.date || 0).getTime();
        
        const bVisitTime = new Date(b.visits.find(v => 
          new Date(v.date).toISOString().split('T')[0] === today
        )?.date || 0).getTime();
        
        return aVisitTime - bVisitTime; // Ascending order (earliest first)
      });
      
      setTodayVisits(patientsWithTodayVisits);
      console.log('Today\'s visits:', patientsWithTodayVisits);
    }
  }, [allPatients]);

  // Search functionality
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredPatients(allPatients);
    } else {
      const filtered = allPatients.filter(
        patient => 
          patient.name.toLowerCase().includes(term) ||
          patient.id.toLowerCase().includes(term) ||
          patient.reason?.toLowerCase().includes(term) ||
          patient.phone?.toLowerCase().includes(term) ||
          patient.email?.toLowerCase().includes(term) ||
          patient.address?.toLowerCase().includes(term)
      );
      setFilteredPatients(filtered);
    }
  };

  // View patient details
  const handleViewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setViewingPatientDetails(true);
  };
  
  // Close patient details modal
  const closePatientDetails = () => {
    setViewingPatientDetails(false);
    setTimeout(() => {
      setSelectedPatient(null);
    }, 300);
  };
  
  // Toggle demographics display
  const toggleDemographics = () => {
    setShowDemographics(!showDemographics);
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Tabs defaultValue="waiting" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-background rounded-md border px-3 py-2 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="bg-background rounded-md border px-3 py-2 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="waiting" className="text-sm">
                  Waiting List
                  {todayVisits.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                      {todayVisits.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="directory" className="text-sm">
                  Patient Directory
                  {allPatients.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {allPatients.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <div className="grid gap-4 md:gap-8 mb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={activeTab === "waiting" ? "Search waiting patients..." : "Search all patients by name, ID, contact..."}
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleDemographics}
                className={showDemographics ? "bg-muted" : ""}
              >
                <PieChart className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Conditional demographics display */}
          <AnimatePresence>
            {showDemographics && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="medi-card p-4">
                    <StatCard 
                      title="Gender Distribution" 
                      data={[
                        { label: "Male", value: 58, color: "bg-blue-500" },
                        { label: "Female", value: 38, color: "bg-pink-500" },
                        { label: "Other", value: 4, color: "bg-purple-500" }
                      ]} 
                    />
                  </div>
                  <div className="medi-card p-4">
                    <StatCard 
                      title="Age Groups" 
                      data={[
                        { label: "0-18", value: 15, color: "bg-green-500" },
                        { label: "19-35", value: 25, color: "bg-yellow-500" },
                        { label: "36-50", value: 30, color: "bg-orange-500" },
                        { label: "51+", value: 30, color: "bg-red-500" }
                      ]} 
                    />
                  </div>
                  <div className="medi-card p-4">
                    <StatCard 
                      title="Visit Types" 
                      data={[
                        { label: "Check-up", value: 45, color: "bg-cyan-500" },
                        { label: "Follow-up", value: 30, color: "bg-indigo-500" },
                        { label: "Emergency", value: 15, color: "bg-rose-500" },
                        { label: "Other", value: 10, color: "bg-gray-500" }
                      ]} 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <TabsContent value="waiting" className="mt-0 border-none p-0">
            <div className="grid gap-4 md:gap-8">
              <PatientWaitingList 
                patients={searchTerm ? filteredPatients.filter(p => todayVisits.some(tv => tv.id === p.id)) : todayVisits} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="directory" className="mt-0 border-none p-0">
            <div className="grid gap-4 md:gap-8">
              <PatientDirectory 
                patients={searchTerm ? filteredPatients : allPatients} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Patient Details Modal */}
      <AnimatePresence>
        {viewingPatientDetails && selectedPatient && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePatientDetails}
          >
            <motion.div
              className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
                <div>
                  <h2 className="text-xl font-semibold">Patient Details</h2>
                  <p className="text-muted-foreground text-sm">Complete profile for {selectedPatient.name}</p>
                </div>
                <button 
                  onClick={closePatientDetails}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mr-4">
                      {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{selectedPatient.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>ID: {selectedPatient.id}</span>
                        <span className="mx-2">•</span>
                        <span>{selectedPatient.age} years</span>
                        <span className="mx-2">•</span>
                        <span>{selectedPatient.gender}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Phone:</span>
                          <span className="text-sm font-medium">{selectedPatient.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="text-sm font-medium">{selectedPatient.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Address:</span>
                          <span className="text-sm font-medium">{selectedPatient.address}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-3">Visit History</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Visit:</span>
                          <span className="text-sm font-medium">{selectedPatient.lastVisit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Reason:</span>
                          <span className="text-sm font-medium">{selectedPatient.reason || 'Regular checkup'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Visits:</span>
                          <span className="text-sm font-medium">{selectedPatient.visits?.length || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;