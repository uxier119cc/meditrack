import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search, Pill, Clock, AlertCircle } from 'lucide-react';
import { suggestionService } from '@/lib/api';
import { debounce } from '@/lib/utils';

// Enhanced fallback suggestions with India-specific medications and dosing patterns
const INDIAN_FALLBACK_SUGGESTIONS = [
  {
    medicine: 'Azithromycin',
    dosage: '500mg',
    duration: '5 days',
    instructions: 'Take one tablet daily on empty stomach',
    followUp: '1 week',
    category: 'Antibiotic',
    warnings: 'Avoid antacids within 2 hours',
    availability: 'Schedule H',
    aliases: ['azee', 'zithromax', 'azithro']
  },
  {
    medicine: 'Pantoprazole',
    dosage: '40mg',
    duration: '14 days',
    instructions: 'Take one tablet before breakfast',
    followUp: '2 weeks',
    category: 'Proton-Pump Inhibitor',
    warnings: 'Take on empty stomach',
    availability: 'Schedule H',
    aliases: ['pan', 'panto', 'pantocid']
  },
  {
    medicine: 'Metformin',
    dosage: '500mg',
    duration: '30 days',
    instructions: 'Take one tablet twice daily after meals',
    followUp: '1 month',
    category: 'Antidiabetic',
    warnings: 'May cause GI disturbances initially',
    availability: 'Schedule H',
    aliases: ['glyciphage', 'glucophage', 'met']
  },
  {
    medicine: 'Amlodipine',
    dosage: '5mg',
    duration: '30 days',
    instructions: 'Take one tablet daily in the evening',
    followUp: '1 month',
    category: 'Antihypertensive',
    warnings: 'May cause ankle swelling',
    availability: 'Schedule H',
    aliases: ['amlo', 'amlod', 'amlogard']
  },
  {
    medicine: 'Paracetamol',
    dosage: '650mg',
    duration: '5 days',
    instructions: 'Take one tablet every 6 hours as needed for fever/pain',
    followUp: 'As needed',
    category: 'Analgesic/Antipyretic',
    warnings: 'Do not exceed 4 tablets in 24 hours',
    availability: 'OTC',
    aliases: ['dolo', 'calpol', 'paracip', 'pcm']
  },
  {
    medicine: 'Cefixime',
    dosage: '200mg',
    duration: '7 days',
    instructions: 'Take one tablet twice daily after meals',
    followUp: '1 week',
    category: 'Antibiotic',
    warnings: 'Complete full course even if symptoms improve',
    availability: 'Schedule H',
    aliases: ['cefix', 'taxim-o', 'cefspan']
  },
  {
    medicine: 'Telmisartan',
    dosage: '40mg',
    duration: '30 days',
    instructions: 'Take one tablet daily in the morning',
    followUp: '1 month',
    category: 'Antihypertensive',
    warnings: 'Monitor blood pressure regularly',
    availability: 'Schedule H',
    aliases: ['telma', 'telsartan', 'telmi']
  },
  {
    medicine: 'Montelukast',
    dosage: '10mg',
    duration: '30 days',
    instructions: 'Take one tablet daily at bedtime',
    followUp: '1 month',
    category: 'Anti-asthmatic',
    warnings: 'May cause behavioral changes',
    availability: 'Schedule H',
    aliases: ['montair', 'montek', 'mont']
  },
  {
    medicine: 'Levocetrizine',
    dosage: '5mg',
    duration: '10 days',
    instructions: 'Take one tablet at bedtime',
    followUp: 'As needed',
    category: 'Antihistamine',
    warnings: 'May cause drowsiness',
    availability: 'Schedule H',
    aliases: ['levo', 'lcz', 'xyzal']
  },
  {
    medicine: 'Rosuvastatin',
    dosage: '10mg',
    duration: '30 days',
    instructions: 'Take one tablet at bedtime',
    followUp: '3 months',
    category: 'Statin',
    warnings: 'Report muscle pain immediately',
    availability: 'Schedule H',
    aliases: ['rosuvas', 'crestor', 'rosu']
  },
  {
    medicine: 'Doxycycline',
    dosage: '100mg',
    duration: '7 days',
    instructions: 'Take one capsule twice daily with food',
    followUp: '1 week',
    category: 'Antibiotic',
    warnings: 'Avoid sun exposure, dairy products',
    availability: 'Schedule H',
    aliases: ['doxy', 'doxt', 'doxybond']
  },
  {
    medicine: 'Metronidazole',
    dosage: '400mg',
    duration: '7 days',
    instructions: 'Take one tablet thrice daily after meals',
    followUp: '1 week',
    category: 'Antibiotic/Antiprotozoal',
    warnings: 'Avoid alcohol during treatment',
    availability: 'Schedule H',
    aliases: ['metro', 'flagyl', 'metrogyl']
  }
];

// Enhanced string similarity function using Levenshtein distance with diacritics handling
const calculateSimilarity = (str1: string, str2: string): number => {
  // Normalize strings to handle diacritics and regional variations
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };
  
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  // Create matrix
  const track = Array(normalized2.length + 1).fill(null).map(() => 
    Array(normalized1.length + 1).fill(null));
  
  // Initialize matrix
  for (let i = 0; i <= normalized1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= normalized2.length; j += 1) {
    track[j][0] = j;
  }
  
  // Fill matrix
  for (let j = 1; j <= normalized2.length; j += 1) {
    for (let i = 1; i <= normalized1.length; i += 1) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  return track[normalized2.length][normalized1.length];
};

interface Medication {
  medicine: string;
  dosage: string;
  duration: string;
  instructions: string;
  followUp?: string;
  category?: string;
  warnings?: string;
  availability?: string;
  aliases?: string[];
}

interface PrescriptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect: (suggestion: Medication) => void;
  placeholder?: string;
  className?: string;
  recentPrescriptions?: Medication[];
  frequentPrescriptions?: Medication[];
}

const PrescriptionAutocomplete: React.FC<PrescriptionAutocompleteProps> = ({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = 'Search medicines (brand or generic name)',
  className = '',
  recentPrescriptions = [],
  frequentPrescriptions = []
}) => {
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'frequent'>('all');
  const [noResults, setNoResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced debounced function to fetch suggestions with better relevance
  const fetchSuggestions = debounce(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    setIsLoading(true);
    setNoResults(false);
    
    try {
      // Try to get suggestions from the API
      const response = await suggestionService.getPrescriptionSuggestions(query);
      if (response.data && response.data.length > 0) {
        setSuggestions(response.data);
      } else {
        // Use local fallback suggestions if API returns empty results
        provideFallbackSuggestions(query);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      provideFallbackSuggestions(query);
    } finally {
      setIsLoading(false);
    }
  }, 250);

  // Provide fallback suggestions with enhanced matching logic
  const provideFallbackSuggestions = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // First try exact matches
    let filteredSuggestions = INDIAN_FALLBACK_SUGGESTIONS.filter(med => 
      med.medicine.toLowerCase().includes(lowerQuery) || 
      `${med.medicine.toLowerCase()} ${med.dosage.toLowerCase()}`.includes(lowerQuery) ||
      (med.category && med.category.toLowerCase().includes(lowerQuery)) ||
      (med.aliases && med.aliases.some(alias => alias.toLowerCase().includes(lowerQuery)))
    );
    
    // If few exact matches, add fuzzy matching for misspellings
    if (filteredSuggestions.length < 3 && lowerQuery.length >= 2) {
      const fuzzyMatches = INDIAN_FALLBACK_SUGGESTIONS.filter(med => {
        // Skip if already in exact matches
        if (filteredSuggestions.includes(med)) return false;
        
        // Check medicine name similarity
        const medNameSimilarity = calculateSimilarity(med.medicine.toLowerCase(), lowerQuery);
        if (medNameSimilarity <= 2) return true; // Allow up to 2 character differences
        
        // Check aliases similarity
        if (med.aliases) {
          return med.aliases.some(alias => {
            const aliasSimilarity = calculateSimilarity(alias.toLowerCase(), lowerQuery);
            return aliasSimilarity <= 2; // Allow up to 2 character differences for aliases
          });
        }
        
        return false;
      });
      
      filteredSuggestions = [...filteredSuggestions, ...fuzzyMatches].slice(0, 10);
    }
    
    setSuggestions(filteredSuggestions);
    setNoResults(filteredSuggestions.length === 0);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length >= 2) {
      fetchSuggestions(newValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: Medication) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    // Focus back on input after selection for quick follow-up entry
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Clear input
  const handleClearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
    inputRef.current?.focus();
  };

  // Filter suggestions based on active tab
  const getFilteredSuggestions = () => {
    if (activeTab === 'recent') {
      return recentPrescriptions;
    } else if (activeTab === 'frequent') {
      return frequentPrescriptions;
    }
    return suggestions;
  };

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-3 border-2 focus:border-blue-600 rounded-lg"
            onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
            ) : value ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                onClick={handleClearInput}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === 'all' ? "default" : "ghost"}
                size="sm"
                className={`px-3 py-1 ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => setActiveTab('all')}
              >
                All Results
              </Button>
              {recentPrescriptions.length > 0 && (
                <Button
                  variant={activeTab === 'recent' ? "default" : "ghost"}
                  size="sm"
                  className={`px-3 py-1 ${activeTab === 'recent' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                  onClick={() => setActiveTab('recent')}
                >
                  Recent
                </Button>
              )}
              {frequentPrescriptions.length > 0 && (
                <Button
                  variant={activeTab === 'frequent' ? "default" : "ghost"}
                  size="sm"
                  className={`px-3 py-1 ${activeTab === 'frequent' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                  onClick={() => setActiveTab('frequent')}
                >
                  Frequent
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
              onClick={() => setShowSuggestions(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {getFilteredSuggestions().length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <ul>
                {getFilteredSuggestions().map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium text-blue-800 flex items-center">
                        <Pill className="h-4 w-4 mr-2 text-blue-600" />
                        {suggestion.medicine} <span className="ml-2 text-gray-600">{suggestion.dosage}</span>
                      </div>
                      {suggestion.availability && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          suggestion.availability === 'Schedule H' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {suggestion.availability}
                        </span>
                      )}
                    </div>
                    
                    {suggestion.category && (
                      <div className="text-xs text-gray-500 mt-1">
                        {suggestion.category}
                      </div>
                    )}
                    
                    <div className="flex items-start mt-2 text-sm">
                      <Clock className="h-3 w-3 mr-1 mt-0.5 text-gray-500" />
                      <span className="text-gray-700">
                        {suggestion.duration && <span className="mr-2">{suggestion.duration}</span>}
                        {suggestion.instructions && <span>{suggestion.instructions}</span>}
                      </span>
                    </div>
                    
                    {suggestion.warnings && (
                      <div className="flex items-start mt-1 text-sm text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1 mt-0.5" />
                        <span>{suggestion.warnings}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center">
              {noResults ? (
                <div className="text-gray-500">
                  <div className="font-medium">No matching medications found</div>
                  <div className="text-sm mt-1">Try searching with a different term or generic name</div>
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="font-medium">Type at least 2 characters to search</div>
                </div>
              )}
            </div>
          )}
          
          <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
            Press Tab to navigate suggestions, Enter to select
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionAutocomplete;