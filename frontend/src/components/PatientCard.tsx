
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatientCardProps {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  initials: string;
}

const PatientCard: React.FC<PatientCardProps> = ({ id, name, age, gender, lastVisit, initials }) => {
  return (
    <div className="medi-card p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-clinical-100 text-clinical-600 flex items-center justify-center font-semibold">
          {initials}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-lg">{name}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{id} • {age}/{gender}</span>
            <span>Last visit: {lastVisit}</span>
          </div>
        </div>
        
        <Link 
          to={`/patients/${id}`}
          className="medi-button-outline group"
        >
          View Details
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default PatientCard;
