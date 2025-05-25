
import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import PatientDetails from '@/pages/PatientDetails';
import NurseManagement from '@/pages/NurseManagement';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctorName, setDoctorName] = useState("Kmit");
  const [doctorInitials, setDoctorInitials] = useState("DK");
  
  useEffect(() => {
    // Get doctor information from localStorage
    const storedDoctor = localStorage.getItem('meditrack-doctor');
    if (storedDoctor) {
      setDoctorName(storedDoctor.replace('Dr. ', ''));
      // Generate initials from the doctor's name
      const initials = storedDoctor
        .split(' ')
        .map(part => part[0])
        .join('')
        .replace('D', '');
      setDoctorInitials(`D${initials}`);
    }
  }, []);
  
  return (
    <Layout doctorName={doctorName} initials={doctorInitials}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients/:id" element={<PatientDetails />} />
        <Route path="/nurse-management" element={<NurseManagement />} />
      </Routes>
    </Layout>
  );
};

export default Index;
