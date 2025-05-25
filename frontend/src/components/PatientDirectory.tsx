import React from 'react';
import { Users, ChevronRight, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  reason: string | null;
  lastVisit: string;
  phone?: string;
  email?: string;
  address?: string;
  visits: {
    date: string;
    complaint: string;
    vitals: {
      bloodPressure: string;
      temperature: string;
      heartRate: string;
    };
  }[];
}

interface PatientDirectoryProps {
  patients: Patient[];
}

const PatientDirectory: React.FC<PatientDirectoryProps> = ({ patients }) => {
  // Sort patients by their most recent visit date (first come first serve)
  const sortedPatients = [...patients].sort((a, b) => {
    // Get the latest visit date for each patient
    const latestVisitA = a.visits && a.visits.length > 0 
      ? new Date(a.visits[0].date).getTime() 
      : 0;
    const latestVisitB = b.visits && b.visits.length > 0 
      ? new Date(b.visits[0].date).getTime() 
      : 0;
    
    // Sort in descending order (newest first)
    return latestVisitB - latestVisitA;
  });
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="medi-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users size={16} />
          </div>
          <h2 className="text-lg font-medium">Patient Directory</h2>
          <Badge variant="outline" className="ml-2 bg-primary/5">
            {sortedPatients.length}
          </Badge>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {sortedPatients.length > 0 ? (
          <motion.table 
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Age/Gender</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Visit</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((patient, index) => (
                <motion.tr 
                  key={patient.id} 
                  className="table-row-hover border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  variants={itemVariants}
                >
                  <td className="p-4 text-sm">
                    <span className="font-mono text-xs bg-primary/5 px-2 py-1 rounded">{patient.id}</span>
                  </td>
                  <td className="p-4 text-sm font-medium">{patient.name}</td>
                  <td className="p-4 text-sm">
                    <Badge variant="outline" className="font-normal">
                      {patient.age}/{patient.gender.charAt(0)}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">
                    {patient.phone && (
                      <div className="flex items-center text-muted-foreground">
                        <Phone size={14} className="mr-1" />
                        {patient.phone}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <span className="text-muted-foreground">{patient.lastVisit}</span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <Link 
                      to={`/patients/${patient.id}`} 
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
                    >
                      View Details
                      <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        ) : (
          <motion.div 
            className="flex flex-col items-center justify-center p-12 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <Users size={32} className="text-primary/60" />
            </div>
            <h3 className="text-xl font-medium mb-2">No patients found</h3>
            <p className="text-muted-foreground max-w-md">Your patient directory appears to be empty. Try adjusting your search terms or add new patients to the system.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientDirectory;
