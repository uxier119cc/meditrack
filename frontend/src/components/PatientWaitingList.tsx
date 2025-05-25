import React from 'react';
import { Users, Clock, ChevronRight, AlertCircle } from 'lucide-react';
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
  visits?: {
    date: string;
    complaint: string;
    vitals?: {
      bloodPressure?: string;
      temperature?: string;
      heartRate?: string;
    };
  }[];
}

interface PatientWaitingListProps {
  patients: Patient[];
}

const PatientWaitingList: React.FC<PatientWaitingListProps> = ({ patients }) => {
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
          <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock size={16} />
          </div>
          <h2 className="text-lg font-medium">Today's Waiting List</h2>
          <Badge variant="secondary" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
            {patients.length}
          </Badge>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {patients.length > 0 ? (
          <motion.table 
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Queue #</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Age/Gender</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reason</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <motion.tr 
                  key={patient.id} 
                  className="table-row-hover border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  variants={itemVariants}
                >
                  <td className="p-4 text-sm">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                      {index + 1}
                    </Badge>
                  </td>
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
                    {patient.reason ? (
                      <span className="text-muted-foreground">{patient.reason}</span>
                    ) : (
                      <span className="text-muted-foreground flex items-center">
                        <AlertCircle size={14} className="mr-1 text-amber-500" />
                        Not specified
                      </span>
                    )}
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
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Clock size={32} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No patients in waiting list</h3>
            <p className="text-muted-foreground max-w-md">There are no patients waiting to be seen today. All patients have been attended to or no visits are scheduled for today.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientWaitingList;
