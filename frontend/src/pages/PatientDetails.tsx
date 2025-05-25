"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Download,
  RotateCcw,
  FileText,
  Phone,
  MapPin,
  Activity,
  FileX,
  HeartPulse,
  Thermometer,
  Wind,
  Calendar,
  ClipboardList,
  AlertCircle,
  Shield,
  Printer,
  User,
  XCircle,
  ChevronDown,
  ChevronUp,
  Mic,
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { patientService, prescriptionService, labReportService } from "@/lib/api"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add these interfaces at the top of your PatientDetails.tsx file

interface Medication {
  medicine: string
  dosage: string
  duration: string
  instructions: string
}

interface PrescriptionData {
  patientId: string
  date: string
  diagnosis: string
  clinicalNotes?: string
  specialInstructions?: string
  followUp?: string
  medications: Medication[]
  isRefill: boolean
  refillDate?: string | null
}

// Helper function to get patient initials
const getPatientInitials = (name: string) => {
  if (!name) return ""
  const nameParts = name.split(" ")
  const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join("")
  return initials
}

// Helper component for displaying info items
const InfoItem = ({ icon, label, value }) => {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-blue-50 transition-colors">
      <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full">{icon}</div>
      <div>
        <p className="text-xs text-blue-700 font-medium">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [showLabReportForm, setShowLabReportForm] = useState(false)
  const [showVitalsForm, setShowVitalsForm] = useState(false)
  const [isRefill, setIsRefill] = useState(false)
  const [refillDate, setRefillDate] = useState("")
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false)
  const [medicationSearchQuery, setMedicationSearchQuery] = useState("")
  const [labReports, setLabReports] = useState<any[]>([])
  const [fetchingLabReports, setFetchingLabReports] = useState(false)
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  // Vitals form state
  const [vitalsData, setVitalsData] = useState({
    BP: "",
    heartRate: "",
    temperature: "",
    weight: "",
    height: "",
    chiefComplaint: "Regular checkup",
  })

  // Prescription form state
  const [diagnosis, setDiagnosis] = useState("")
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [medications, setMedications] = useState([
    { medicine: "", dosage: "", duration: "", instructions: "" },
    { medicine: "", dosage: "", duration: "", instructions: "" },
  ])

  // Lab report form state
  const [labReportName, setLabReportName] = useState("")
  const [labReportDate, setLabReportDate] = useState("")
  const [labReportCategory, setLabReportCategory] = useState("")
  const [labReportSummary, setLabReportSummary] = useState("")
  const [labParameters, setLabParameters] = useState([
    { name: "", value: "", unit: "", status: "normal" },
    { name: "", value: "", unit: "", status: "normal" },
    { name: "", value: "", unit: "", status: "normal" },
  ])

  // Common medications for suggestions - Expanded database with 100+ medications
  const commonMedications = [
    // Antibiotics
    { medicine: "Amoxicillin", dosage: "500mg", duration: "7 days", instructions: "Take 1 tablet 3 times daily with food", conditions: ["Bacterial Infections", "Respiratory Infections", "Ear Infections"] },
    { medicine: "Azithromycin", dosage: "250mg", duration: "5 days", instructions: "Take 2 tablets on day 1, then 1 tablet daily", conditions: ["Respiratory Infections", "Skin Infections"] },
    { medicine: "Ciprofloxacin", dosage: "500mg", duration: "7 days", instructions: "Take 1 tablet twice daily", conditions: ["Urinary Tract Infections", "Respiratory Infections"] },
    { medicine: "Doxycycline", dosage: "100mg", duration: "10 days", instructions: "Take 1 tablet twice daily with food", conditions: ["Respiratory Infections", "Skin Infections", "Lyme Disease"] },
    { medicine: "Cephalexin", dosage: "500mg", duration: "7 days", instructions: "Take 1 capsule 4 times daily", conditions: ["Skin Infections", "Respiratory Infections"] },
    { medicine: "Trimethoprim-Sulfamethoxazole", dosage: "800/160mg", duration: "10 days", instructions: "Take 1 tablet twice daily", conditions: ["Urinary Tract Infections", "Respiratory Infections"] },
    { medicine: "Clindamycin", dosage: "300mg", duration: "7 days", instructions: "Take 1 capsule 4 times daily", conditions: ["Dental Infections", "Skin Infections"] },
    { medicine: "Metronidazole", dosage: "500mg", duration: "7 days", instructions: "Take 1 tablet 3 times daily with food", conditions: ["Anaerobic Infections", "Dental Infections"] },
    { medicine: "Nitrofurantoin", dosage: "100mg", duration: "7 days", instructions: "Take 1 capsule twice daily with food", conditions: ["Urinary Tract Infections"] },
    { medicine: "Amoxicillin-Clavulanate", dosage: "875/125mg", duration: "10 days", instructions: "Take 1 tablet twice daily with food", conditions: ["Respiratory Infections", "Skin Infections"] },
    
    // Diabetes Medications
    { medicine: "Metformin", dosage: "500mg", duration: "30 days", instructions: "Take 1 tablet twice daily with meals", conditions: ["Diabetes"] },
    { medicine: "Glipizide", dosage: "5mg", duration: "30 days", instructions: "Take 1 tablet daily before breakfast", conditions: ["Diabetes"] },
    { medicine: "Glyburide", dosage: "5mg", duration: "30 days", instructions: "Take 1 tablet daily with breakfast", conditions: ["Diabetes"] },
    { medicine: "Sitagliptin", dosage: "100mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Diabetes"] },
    { medicine: "Empagliflozin", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily in the morning", conditions: ["Diabetes"] },
    { medicine: "Pioglitazone", dosage: "30mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Diabetes"] },
    { medicine: "Liraglutide", dosage: "1.2mg", duration: "30 days", instructions: "Inject 1.2mg subcutaneously once daily", conditions: ["Diabetes"] },
    { medicine: "Dulaglutide", dosage: "0.75mg", duration: "30 days", instructions: "Inject 0.75mg subcutaneously once weekly", conditions: ["Diabetes"] },
    { medicine: "Insulin Glargine", dosage: "10 units", duration: "30 days", instructions: "Inject 10 units subcutaneously once daily at bedtime", conditions: ["Diabetes"] },
    { medicine: "Insulin Lispro", dosage: "4-6 units", duration: "30 days", instructions: "Inject 4-6 units subcutaneously before meals", conditions: ["Diabetes"] },
    
    // Cardiovascular Medications
    { medicine: "Atorvastatin", dosage: "20mg", duration: "30 days", instructions: "Take 1 tablet daily at bedtime", conditions: ["High Cholesterol"] },
    { medicine: "Lisinopril", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily in the morning", conditions: ["Hypertension"] },
    { medicine: "Amlodipine", dosage: "5mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Hypertension"] },
    { medicine: "Metoprolol", dosage: "50mg", duration: "30 days", instructions: "Take 1 tablet twice daily", conditions: ["Hypertension", "Heart Failure"] },
    { medicine: "Losartan", dosage: "50mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Hypertension"] },
    { medicine: "Hydrochlorothiazide", dosage: "25mg", duration: "30 days", instructions: "Take 1 tablet daily in the morning", conditions: ["Hypertension"] },
    { medicine: "Simvastatin", dosage: "20mg", duration: "30 days", instructions: "Take 1 tablet daily at bedtime", conditions: ["High Cholesterol"] },
    { medicine: "Rosuvastatin", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["High Cholesterol"] },
    { medicine: "Valsartan", dosage: "80mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Hypertension"] },
    { medicine: "Carvedilol", dosage: "6.25mg", duration: "30 days", instructions: "Take 1 tablet twice daily with food", conditions: ["Heart Failure", "Hypertension"] },
    { medicine: "Diltiazem", dosage: "120mg", duration: "30 days", instructions: "Take 1 tablet twice daily", conditions: ["Hypertension", "Angina"] },
    { medicine: "Furosemide", dosage: "40mg", duration: "30 days", instructions: "Take 1 tablet daily in the morning", conditions: ["Edema", "Heart Failure"] },
    { medicine: "Spironolactone", dosage: "25mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Heart Failure", "Hypertension"] },
    { medicine: "Warfarin", dosage: "5mg", duration: "30 days", instructions: "Take as directed based on INR results", conditions: ["Atrial Fibrillation", "DVT", "PE"] },
    { medicine: "Clopidogrel", dosage: "75mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Coronary Artery Disease", "Stroke Prevention"] },
    { medicine: "Aspirin", dosage: "81mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Coronary Artery Disease", "Stroke Prevention"] },
    
    // Gastrointestinal Medications
    { medicine: "Omeprazole", dosage: "20mg", duration: "14 days", instructions: "Take 1 capsule daily before breakfast", conditions: ["GERD", "Acid Reflux", "Peptic Ulcer"] },
    { medicine: "Pantoprazole", dosage: "40mg", duration: "30 days", instructions: "Take 1 tablet daily before breakfast", conditions: ["GERD", "Acid Reflux"] },
    { medicine: "Esomeprazole", dosage: "40mg", duration: "14 days", instructions: "Take 1 capsule daily before breakfast", conditions: ["GERD", "Acid Reflux"] },
    { medicine: "Ranitidine", dosage: "150mg", duration: "14 days", instructions: "Take 1 tablet twice daily", conditions: ["GERD", "Acid Reflux"] },
    { medicine: "Famotidine", dosage: "20mg", duration: "14 days", instructions: "Take 1 tablet twice daily", conditions: ["GERD", "Acid Reflux"] },
    { medicine: "Ondansetron", dosage: "4mg", duration: "as needed", instructions: "Take 1 tablet every 8 hours as needed for nausea", conditions: ["Nausea", "Vomiting"] },
    { medicine: "Promethazine", dosage: "25mg", duration: "as needed", instructions: "Take 1 tablet every 6 hours as needed for nausea", conditions: ["Nausea", "Vomiting"] },
    { medicine: "Dicyclomine", dosage: "10mg", duration: "7 days", instructions: "Take 1 capsule 4 times daily before meals", conditions: ["IBS", "Abdominal Cramps"] },
    { medicine: "Loperamide", dosage: "2mg", duration: "as needed", instructions: "Take 2 capsules after first loose stool, then 1 after each subsequent loose stool (max 8/day)", conditions: ["Diarrhea"] },
    { medicine: "Polyethylene Glycol", dosage: "17g", duration: "14 days", instructions: "Mix 1 capful in 8 oz water and drink daily", conditions: ["Constipation"] },
    
    // Pain Medications
    { medicine: "Ibuprofen", dosage: "400mg", duration: "5 days", instructions: "Take 1 tablet every 6-8 hours with food as needed", conditions: ["Pain", "Inflammation", "Fever"] },
    { medicine: "Acetaminophen", dosage: "500mg", duration: "5 days", instructions: "Take 2 tablets every 6 hours as needed", conditions: ["Pain", "Fever"] },
    { medicine: "Naproxen", dosage: "500mg", duration: "10 days", instructions: "Take 1 tablet twice daily with food", conditions: ["Pain", "Inflammation"] },
    { medicine: "Meloxicam", dosage: "7.5mg", duration: "30 days", instructions: "Take 1 tablet daily with food", conditions: ["Arthritis", "Joint Pain"] },
    { medicine: "Tramadol", dosage: "50mg", duration: "5 days", instructions: "Take 1 tablet every 6 hours as needed for pain", conditions: ["Moderate Pain"] },
    { medicine: "Gabapentin", dosage: "300mg", duration: "30 days", instructions: "Take 1 capsule 3 times daily", conditions: ["Neuropathic Pain", "Seizures"] },
    { medicine: "Pregabalin", dosage: "75mg", duration: "30 days", instructions: "Take 1 capsule twice daily", conditions: ["Neuropathic Pain", "Fibromyalgia"] },
    { medicine: "Duloxetine", dosage: "30mg", duration: "30 days", instructions: "Take 1 capsule daily", conditions: ["Neuropathic Pain", "Depression", "Anxiety"] },
    { medicine: "Cyclobenzaprine", dosage: "10mg", duration: "7 days", instructions: "Take 1 tablet 3 times daily as needed for muscle spasms", conditions: ["Muscle Spasms"] },
    { medicine: "Diclofenac", dosage: "50mg", duration: "7 days", instructions: "Take 1 tablet 3 times daily with food", conditions: ["Pain", "Inflammation"] },
    
    // Respiratory Medications
    { medicine: "Albuterol", dosage: "90mcg", duration: "as needed", instructions: "2 puffs every 4-6 hours as needed for breathing", conditions: ["Asthma", "COPD"] },
    { medicine: "Fluticasone", dosage: "110mcg", duration: "30 days", instructions: "2 puffs twice daily", conditions: ["Asthma", "Allergic Rhinitis"] },
    { medicine: "Montelukast", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily at bedtime", conditions: ["Asthma", "Allergic Rhinitis"] },
    { medicine: "Tiotropium", dosage: "18mcg", duration: "30 days", instructions: "Inhale contents of 1 capsule daily using HandiHaler device", conditions: ["COPD"] },
    { medicine: "Budesonide-Formoterol", dosage: "160/4.5mcg", duration: "30 days", instructions: "2 inhalations twice daily", conditions: ["Asthma", "COPD"] },
    { medicine: "Cetirizine", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Allergies", "Allergic Rhinitis"] },
    { medicine: "Loratadine", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Allergies", "Allergic Rhinitis"] },
    { medicine: "Fexofenadine", dosage: "180mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Allergies", "Allergic Rhinitis"] },
    { medicine: "Diphenhydramine", dosage: "25mg", duration: "as needed", instructions: "Take 1-2 capsules at bedtime as needed", conditions: ["Allergies", "Insomnia"] },
    { medicine: "Pseudoephedrine", dosage: "60mg", duration: "5 days", instructions: "Take 1 tablet every 6 hours as needed", conditions: ["Nasal Congestion"] },
    
    // Mental Health Medications
    { medicine: "Sertraline", dosage: "50mg", duration: "30 days", instructions: "Take 1 tablet daily in the morning", conditions: ["Depression", "Anxiety"] },
    { medicine: "Fluoxetine", dosage: "20mg", duration: "30 days", instructions: "Take 1 capsule daily in the morning", conditions: ["Depression", "Anxiety", "OCD"] },
    { medicine: "Escitalopram", dosage: "10mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Depression", "Anxiety"] },
    { medicine: "Bupropion", dosage: "150mg", duration: "30 days", instructions: "Take 1 tablet daily in the morning", conditions: ["Depression", "Smoking Cessation"] },
    { medicine: "Venlafaxine", dosage: "75mg", duration: "30 days", instructions: "Take 1 capsule daily with food", conditions: ["Depression", "Anxiety"] },
    { medicine: "Trazodone", dosage: "50mg", duration: "30 days", instructions: "Take 1-2 tablets at bedtime as needed", conditions: ["Insomnia", "Depression"] },
    { medicine: "Mirtazapine", dosage: "15mg", duration: "30 days", instructions: "Take 1 tablet at bedtime", conditions: ["Depression", "Insomnia"] },
    { medicine: "Alprazolam", dosage: "0.5mg", duration: "7 days", instructions: "Take 1 tablet 3 times daily as needed for anxiety", conditions: ["Anxiety", "Panic Disorder"] },
    { medicine: "Lorazepam", dosage: "1mg", duration: "7 days", instructions: "Take 1 tablet 2-3 times daily as needed for anxiety", conditions: ["Anxiety"] },
    { medicine: "Clonazepam", dosage: "0.5mg", duration: "14 days", instructions: "Take 1 tablet twice daily", conditions: ["Anxiety", "Panic Disorder"] },
    
    // Endocrine Medications
    { medicine: "Levothyroxine", dosage: "50mcg", duration: "30 days", instructions: "Take 1 tablet daily on empty stomach", conditions: ["Hypothyroidism"] },
    { medicine: "Prednisone", dosage: "10mg", duration: "5 days", instructions: "Take 2 tablets daily for 5 days, then 1 tablet daily for 5 days, then 0.5 tablet daily for 5 days", conditions: ["Inflammation", "Allergic Reactions"] },
    { medicine: "Methylprednisolone", dosage: "4mg", duration: "6 days", instructions: "Take as directed per dose pack", conditions: ["Inflammation", "Allergic Reactions"] },
    { medicine: "Estradiol", dosage: "1mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Menopause Symptoms", "Hormone Replacement"] },
    { medicine: "Alendronate", dosage: "70mg", duration: "30 days", instructions: "Take 1 tablet once weekly on an empty stomach with water", conditions: ["Osteoporosis"] },
    
    // Neurological Medications
    { medicine: "Sumatriptan", dosage: "50mg", duration: "as needed", instructions: "Take 1 tablet at onset of migraine, may repeat after 2 hours if needed (max 200mg/day)", conditions: ["Migraine"] },
    { medicine: "Topiramate", dosage: "25mg", duration: "30 days", instructions: "Take 1 tablet daily for 1 week, then increase to 1 tablet twice daily", conditions: ["Migraine Prevention", "Seizures"] },
    { medicine: "Propranolol", dosage: "20mg", duration: "30 days", instructions: "Take 1 tablet twice daily", conditions: ["Migraine Prevention", "Hypertension"] },
    { medicine: "Levetiracetam", dosage: "500mg", duration: "30 days", instructions: "Take 1 tablet twice daily", conditions: ["Seizures"] },
    { medicine: "Lamotrigine", dosage: "25mg", duration: "30 days", instructions: "Take 1 tablet daily for 2 weeks, then increase as directed", conditions: ["Seizures", "Bipolar Disorder"] },
    
    // Antimalarials and Antiparasitics
    { medicine: "Hydroxychloroquine", dosage: "200mg", duration: "30 days", instructions: "Take 1 tablet twice daily with food", conditions: ["Rheumatoid Arthritis", "Lupus"] },
    { medicine: "Mebendazole", dosage: "100mg", duration: "3 days", instructions: "Take 1 tablet twice daily for 3 days", conditions: ["Pinworm", "Roundworm"] },
    { medicine: "Ivermectin", dosage: "3mg", duration: "single dose", instructions: "Take 5 tablets as a single dose on empty stomach", conditions: ["Scabies", "Strongyloidiasis"] },
    
    // Dermatological Medications
    { medicine: "Hydrocortisone Cream", dosage: "1%", duration: "7 days", instructions: "Apply thin layer to affected area twice daily", conditions: ["Dermatitis", "Eczema"] },
    { medicine: "Triamcinolone Cream", dosage: "0.1%", duration: "14 days", instructions: "Apply thin layer to affected area twice daily", conditions: ["Dermatitis", "Eczema", "Psoriasis"] },
    { medicine: "Mupirocin Ointment", dosage: "2%", duration: "7 days", instructions: "Apply small amount to affected area 3 times daily", conditions: ["Skin Infections", "Impetigo"] },
    { medicine: "Clotrimazole Cream", dosage: "1%", duration: "14 days", instructions: "Apply thin layer to affected area twice daily", conditions: ["Fungal Infections"] },
    { medicine: "Tretinoin Cream", dosage: "0.025%", duration: "30 days", instructions: "Apply pea-sized amount to face at bedtime", conditions: ["Acne"] },
    
    // Urological Medications
    { medicine: "Tamsulosin", dosage: "0.4mg", duration: "30 days", instructions: "Take 1 capsule daily at bedtime", conditions: ["BPH", "Urinary Retention"] },
    { medicine: "Finasteride", dosage: "5mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["BPH"] },
    { medicine: "Oxybutynin", dosage: "5mg", duration: "30 days", instructions: "Take 1 tablet twice daily", conditions: ["Overactive Bladder"] },
    
    // Ophthalmological Medications
    { medicine: "Artificial Tears", dosage: "1-2 drops", duration: "as needed", instructions: "Place 1-2 drops in affected eye(s) as needed for dryness", conditions: ["Dry Eyes"] },
    { medicine: "Latanoprost Eye Drops", dosage: "0.005%", duration: "30 days", instructions: "Place 1 drop in affected eye(s) daily at bedtime", conditions: ["Glaucoma"] },
    { medicine: "Tobramycin-Dexamethasone Eye Drops", dosage: "0.3%/0.1%", duration: "7 days", instructions: "Place 1 drop in affected eye(s) 4 times daily", conditions: ["Eye Infection", "Conjunctivitis"] },
    
    // Vitamins and Supplements
    { medicine: "Vitamin D3", dosage: "2000 IU", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Vitamin D Deficiency"] },
    { medicine: "Calcium Carbonate", dosage: "600mg", duration: "30 days", instructions: "Take 1 tablet twice daily with food", conditions: ["Calcium Deficiency", "Osteoporosis Prevention"] },
    { medicine: "Ferrous Sulfate", dosage: "325mg", duration: "30 days", instructions: "Take 1 tablet daily with food", conditions: ["Iron Deficiency Anemia"] },
    { medicine: "Folic Acid", dosage: "1mg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["Folate Deficiency", "Pregnancy"] },
    { medicine: "Vitamin B12", dosage: "1000mcg", duration: "30 days", instructions: "Take 1 tablet daily", conditions: ["B12 Deficiency"] },
    
    // Miscellaneous
    { medicine: "Naloxone", dosage: "4mg", duration: "as needed", instructions: "Administer 1 spray into one nostril at first sign of opioid overdose", conditions: ["Opioid Overdose"] },
    { medicine: "Epinephrine Auto-Injector", dosage: "0.3mg", duration: "as needed", instructions: "Inject into outer thigh at first sign of severe allergic reaction", conditions: ["Severe Allergic Reaction", "Anaphylaxis"] }
  ];

  // Common lab parameters for autocomplete suggestions
  const commonLabTests = {
    "Complete Blood Count (CBC)": [
      { name: "Hemoglobin", units: ["g/dL"], normalRanges: { male: "13.5-17.5", female: "12.0-15.5" } },
      { name: "White Blood Cell Count", units: ["cells/μL", "x10^3/μL"], normalRanges: { adult: "4,500-11,000" } },
      { name: "Platelet Count", units: ["platelets/μL", "x10^3/μL"], normalRanges: { adult: "150,000-450,000" } },
      {
        name: "Red Blood Cell Count",
        units: ["cells/μL", "x10^6/μL"],
        normalRanges: { male: "4.5-5.9", female: "4.0-5.2" },
      },
      { name: "Hematocrit", units: ["%"], normalRanges: { male: "41-50", female: "36-44" } },
    ],
    "Lipid Panel": [
      { name: "Total Cholesterol", units: ["mg/dL"], normalRanges: { adult: "<200" } },
      { name: "HDL Cholesterol", units: ["mg/dL"], normalRanges: { adult: ">40" } },
      { name: "LDL Cholesterol", units: ["mg/dL"], normalRanges: { adult: "<100" } },
      { name: "Triglycerides", units: ["mg/dL"], normalRanges: { adult: "<150" } },
    ],
    "Liver Function Tests": [
      { name: "ALT", units: ["U/L"], normalRanges: { adult: "7-56" } },
      { name: "AST", units: ["U/L"], normalRanges: { adult: "5-40" } },
      { name: "Alkaline Phosphatase", units: ["U/L"], normalRanges: { adult: "44-147" } },
      { name: "Total Bilirubin", units: ["mg/dL"], normalRanges: { adult: "0.1-1.2" } },
    ],
    "Kidney Function Tests": [
      { name: "BUN", units: ["mg/dL"], normalRanges: { adult: "7-20" } },
      { name: "Creatinine", units: ["mg/dL"], normalRanges: { male: "0.7-1.3", female: "0.6-1.1" } },
      { name: "eGFR", units: ["mL/min/1.73m²"], normalRanges: { adult: ">60" } },
    ],
    Electrolytes: [
      { name: "Sodium", units: ["mEq/L"], normalRanges: { adult: "136-145" } },
      { name: "Potassium", units: ["mEq/L"], normalRanges: { adult: "3.5-5.0" } },
      { name: "Chloride", units: ["mEq/L"], normalRanges: { adult: "98-106" } },
      { name: "Bicarbonate", units: ["mEq/L"], normalRanges: { adult: "23-28" } },
    ],
    "Glucose Tests": [
      { name: "Fasting Blood Glucose", units: ["mg/dL"], normalRanges: { adult: "70-99" } },
      { name: "HbA1c", units: ["%"], normalRanges: { adult: "<5.7" } },
    ],
  }

  // Flatten the lab tests for easier searching
  const allLabTests = Object.values(commonLabTests).flat()

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true)

        // First try to get the specific patient by ID
        if (id) {
          try {
            console.log("Fetching patient with ID:", id)

            // Try to find patient by MongoDB _id first
            let patientData
            try {
              patientData = await patientService.getPatient(id)
            } catch (error) {
              console.log("Error fetching by _id, trying to find by patientId")

              // If that fails, try to find by patientId (custom ID)
              const allPatients = await patientService.getAllPatients()
              patientData = allPatients.find((p) => p.patientId === id)

              if (!patientData) {
                throw new Error("Patient not found with either _id or patientId")
              }
            }

            console.log("Fetched patient data:", patientData)

            // Check if prescriptions exist in the patient data
            if (patientData.prescriptions) {
              console.log("Prescriptions found:", patientData.prescriptions)
            } else {
              console.log("No prescriptions found in patient data")
            }

            // Check if lab reports exist in the patient data
            if (patientData.labReports) {
              console.log("Lab reports found:", patientData.labReports)
            } else {
              console.log("No lab reports found in patient data")
            }

            // Get lab reports from localStorage
            let savedLabReports = []
            try {
              const savedLabReportsString = localStorage.getItem(`labReports_${patientData._id}`)
              if (savedLabReportsString) {
                savedLabReports = JSON.parse(savedLabReportsString)
                console.log("Retrieved lab reports from localStorage:", savedLabReports)
              }
            } catch (error) {
              console.error("Error retrieving lab reports from localStorage:", error)
            }

            // Fetch prescriptions for this patient
            let prescriptions = []
            try {
              const prescriptionsData = await prescriptionService.getPatientPrescriptions(patientData._id)
              console.log("Fetched prescriptions from API:", prescriptionsData)
              prescriptions = prescriptionsData
            } catch (error) {
              console.error("Error fetching prescriptions:", error)
            }

            // Transform the API data to match the expected format if needed
            const transformedPatient = {
              _id: patientData._id, // Keep the MongoDB _id
              id: patientData._id, // Also store as id for compatibility
              patientId: patientData.patientId,
              name: patientData.name,
              age: patientData.age,
              gender: patientData.gender,
              phone: patientData.contact,
              emergencyContact: patientData.emergencyContact || "",
              email: patientData.email || "",
              address: patientData.address,
              // bloodType: patient.bloodGroup || 'O+',
              allergies: patientData.allergies || [],
              medicalHistory: [patientData.medicalHistory],
              labReports: savedLabReports || [],
              notes: patientData.notes || [],
              prescriptions: prescriptions || [],
              visits:
                patientData.visits?.map((visit) => ({
                  date: new Date(visit.date).toLocaleDateString(),
                  diagnosis: visit.diagnosis || "",
                  notes: visit.notes || "",
                  specialInstructions: visit.specialInstructions || "",
                  followUp: visit.followUp || "",
                  prescriptions: visit.prescriptions || [],
                  BP: visit.BP,
                  heartRate: visit.heartRate,
                  temperature: visit.temperature,
                  weight: visit.weight,
                  height: visit.height,
                  bmi: visit.bmi,
                  bmiCategory: visit.bmiCategory,
                })) || [],
              // Prescriptions already fetched and added above
            }

            setPatient(transformedPatient)
            setLoading(false)
            return
          } catch (error) {
            console.error("Error fetching specific patient:", error)
            // Continue to fetch all patients as fallback
          }
        }

        // If specific patient fetch fails or no ID provided, get all patients
        const allPatients = await patientService.getAllPatients()
        console.log("Fetched all patients:", allPatients)

        // Transform the API data to match the expected format
        const transformedPatients = allPatients.map((patient) => ({
          _id: patient._id, // Keep the MongoDB _id
          id: patient._id, // Also store as id for compatibility
          patientId: patient.patientId,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.contact,
          emergencyContact: patient.emergencyContact || "",
          email: patient.email || "",
          address: patient.address,
          // bloodType: patient.bloodGroup || 'O+',
          allergies: patient.allergies || [],
          medicalHistory: [patient.medicalHistory],
          visits:
            patient.visits?.map((visit) => ({
              date: new Date(visit.date).toLocaleDateString(),
              diagnosis: visit.diagnosis || "",
              notes: visit.notes || "",
              specialInstructions: visit.specialInstructions || "",
              followUp: visit.followUp || "",
              prescriptions: visit.prescriptions || [],
              BP: visit.BP,
              heartRate: visit.heartRate,
              temperature: visit.temperature,
              weight: visit.weight,
              height: visit.height,
              bmi: visit.bmi,
              bmiCategory: visit.bmiCategory,
            })) || [],
          // Would need to fetch prescriptions per patient when needed
        }))

        const foundPatient = transformedPatients.find((p) => p.id === id)

        if (foundPatient) {
          setPatient(foundPatient)
        } else if (transformedPatients.length > 0) {
          // If patient not found, use the first one as fallback
          setPatient(transformedPatients[0])
          toast({
            title: "Patient not found",
            description: "Displaying default patient information",
            variant: "destructive",
          })
        } else {
          toast({
            title: "No patients available",
            description: "No patient data could be retrieved",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching patient data:", error)
        toast({
          title: "Error loading patient data",
          description: "There was a problem fetching patient information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [id])

  const handleExportPrescription = async (prescriptionId: string) => {
    try {
      if (!prescriptionId || prescriptionId === "undefined") {
        toast({
          title: "Export failed",
          description: "Invalid prescription ID",
          variant: "destructive",
        })
        return
      }

      // Create a print-friendly version of the prescription
      const prescription = patient.prescriptions.find((p) => p._id === prescriptionId || p.id === prescriptionId)

      if (!prescription) {
        toast({
          title: "Export failed",
          description: "Prescription not found",
          variant: "destructive",
        })
        return
      }

      // Format the date
      let displayDate = "Unknown Date"
      if (prescription.date) {
        try {
          displayDate = new Date(prescription.date).toLocaleDateString()
        } catch (e) {
          displayDate = String(prescription.date).split("T")[0] || "Unknown Date"
        }
      }

      // Create the HTML content for printing
      const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>MEDITRACK - Prescription for ${patient.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      :root {
        --primary-color: #2563eb;
        --secondary-color: #0f172a;
        --accent-color: #3b82f6;
        --light-color: #f8fafc;
        --border-color: #cbd5e0;
        --text-color: #334155;
        --heading-color: #1e40af;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Poppins', Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: #fff;
        position: relative;
        padding: 0;
        margin: 0;
      }
      
      .watermark {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 0;
      }
      
      .watermark::after {
        content: "MEDITRACK";
        font-size: 12rem;
        font-weight: 700;
        color: rgba(203, 213, 225, 0.15);
        transform: rotate(-45deg);
        letter-spacing: 0.5rem;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        position: relative;
        z-index: 1;
        background-color: #fff;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--primary-color);
      }
      
      .branding {
        display: flex;
        flex-direction: column;
      }
      
      .logo {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--primary-color);
        letter-spacing: 0.15rem;
      }
      
      .tagline {
        font-size: 0.85rem;
        color: var(--text-color);
        font-style: italic;
      }
      
      .prescription-id {
        background-color: var(--primary-color);
        color: white;
        padding: 8px 15px;
        border-radius: 5px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      
      .date-container {
        margin-top: 5px;
        text-align: right;
        font-size: 0.9rem;
      }
      
      .info-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .patient-info, .doctor-info {
        background-color: var(--light-color);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .info-title {
        color: var(--heading-color);
        font-size: 1.25rem;
        margin-bottom: 15px;
        position: relative;
        padding-bottom: 8px;
      }
      
      .info-title::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background-color: var(--primary-color);
      }
      
      .info-item {
        margin-bottom: 8px;
        display: flex;
        align-items: baseline;
      }
      
      .info-label {
        font-weight: 600;
        color: var(--secondary-color);
        min-width: 100px;
      }
      
      .info-value {
        color: var(--text-color);
      }
      
      .section {
        margin-bottom: 30px;
      }
      
      .section-title {
        color: var(--heading-color);
        font-size: 1.2rem;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .diagnosis {
        background-color: #e0f2fe;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid var(--accent-color);
      }
      
      .medications {
        display: grid;
        grid-template-columns: 1fr;
        gap: 15px;
      }
      
      .medication {
        background-color: var(--light-color);
        border-radius: 8px;
        padding: 15px;
        border: 1px solid var(--border-color);
        position: relative;
        transition: transform 0.2s ease;
      }
      
      .medication:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .medication-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .medication-name {
        font-weight: 600;
        color: var(--secondary-color);
        font-size: 1.1rem;
      }
      
      .medication-duration {
        background-color: var(--primary-color);
        color: white;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
      }
      
      .medication-details {
        color: var(--text-color);
        padding: 8px 0;
        border-top: 1px dashed var(--border-color);
        margin-top: 8px;
      }
      
      .clinical-notes {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #64748b;
      }
      
      .special-instructions {
        background-color: #fff7ed;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #f97316;
      }
      
      .follow-up {
        background-color: #ecfdf5;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #10b981;
        margin-bottom: 30px;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
      }
      
      .footer-left {
        max-width: 60%;
      }
      
      .footer-text {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 8px;
      }
      
      .footer-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .signature-line {
        width: 200px;
        height: 1px;
        background-color: var(--text-color);
        margin-bottom: 5px;
      }
      
      .doctor-signature {
        font-size: 0.85rem;
        color: var(--text-color);
        text-align: center;
      }
      
      .qr-placeholder {
        width: 80px;
        height: 80px;
        background-color: #f1f5f9;
        border: 1px dashed var(--border-color);
        margin-bottom: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 0.7rem;
        color: #64748b;
      }
      
      .digital-verification {
        font-size: 0.7rem;
        color: #64748b;
        text-align: center;
      }
      
      .print-button {
        display: block;
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin: 30px auto 0;
        font-weight: 600;
        transition: background-color 0.2s ease;
      }
      
      .print-button:hover {
        background-color: #1d4ed8;
      }
      
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        .container {
          box-shadow: none;
          padding: 20px;
        }
        .no-print {
          display: none;
        }
        .watermark::after {
          font-size: 10rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="watermark"></div>
    
    <div class="container">
      <div class="header">
        <div class="branding">
          <div class="logo">MEDITRACK</div>
          <div class="tagline">Advanced Healthcare Solutions</div>
        </div>
        <div class="header-right">
          <div class="prescription-id">RX-${Math.floor(100000 + Math.random() * 900000)}</div>
          <div class="date-container">${displayDate}</div>
        </div>
      </div>
      
      <div class="info-container">
        <div class="patient-info">
          <h3 class="info-title">Patient Information</h3>
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${patient.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Patient ID:</span>
            <span class="info-value">${patient.patientId || patient.id || "N/A"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Age:</span>
            <span class="info-value">${patient.age} years</span>
          </div>
          <div class="info-item">
            <span class="info-label">Gender:</span>
            <span class="info-value">${patient.gender}</span>
          </div>
        </div>
        
        <div class="doctor-info">
          <h3 class="info-title">Provider Information</h3>
          <div class="info-item">
            <span class="info-label">Doctor:</span>
            <span class="info-value">Dr. ${prescription.doctorName || "Healthcare Provider"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Specialty:</span>
            <span class="info-value">${prescription.specialty || "General Medicine"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">License No:</span>
            <span class="info-value">${prescription.licenseNumber || "MD12345"}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">Diagnosis</h3>
        <div class="diagnosis">
          ${prescription.diagnosis || "No diagnosis provided"}
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">Medications</h3>
        <div class="medications">
          ${
            prescription.medications && prescription.medications.length > 0
              ? prescription.medications
                  .map(
                    (med, index) => `
                    <div class="medication">
                      <div class="medication-header">
                        <span class="medication-name">${med.medicine}</span>
                        <span class="medication-duration">${med.duration}</span>
                      </div>
                      <div class="medication-details">
                        ${med.dosage} - ${med.instructions || med.notes || "Take as directed"}
                      </div>
                    </div>
                  `
                  )
                  .join("")
              : `<div class="medication">
                   <div class="medication-header">
                     <span class="medication-name">No medications prescribed</span>
                   </div>
                 </div>`
          }
        </div>
      </div>
      
      ${
        prescription.clinicalNotes
          ? `
          <div class="section">
            <h3 class="section-title">Clinical Notes</h3>
            <div class="clinical-notes">
              ${prescription.clinicalNotes}
            </div>
          </div>
        `
          : ""
      }
      
      ${
        prescription.specialInstructions
          ? `
          <div class="section">
            <h3 class="section-title">Special Instructions</h3>
            <div class="special-instructions">
              ${prescription.specialInstructions}
            </div>
          </div>
        `
          : ""
      }
      
      ${
        prescription.followUp
          ? `
          <div class="section">
            <h3 class="section-title">Follow-up Appointment</h3>
            <div class="follow-up">
              Please schedule a follow-up appointment in ${prescription.followUp}
            </div>
          </div>
        `
          : ""
      }
      
      <div class="footer">
        <div class="footer-left">
          <p class="footer-text">This is a confidential medical prescription issued through the MEDITRACK system.</p>
          <p class="footer-text">Please follow all medication instructions carefully and contact your healthcare provider with any questions.</p>
        </div>
        
        <div class="footer-right">
          <div class="qr-placeholder">Digital Seal</div>
          <div class="signature-line"></div>
          <div class="doctor-signature">Doctor's Signature</div>
          <div class="digital-verification">Digitally verified by MEDITRACK</div>
        </div>
      </div>
      
      <div class="no-print">
        <button class="print-button" onclick="window.print()">
          Print Prescription
        </button>
      </div>
    </div>
  </body>
  </html>
`

// Create a new window for printing
const printWindow = window.open("", "_blank")

if (!printWindow) {
  toast({
    title: "Print blocked",
    description: "Please allow pop-ups to print prescriptions",
    variant: "destructive",
  })
  return
}

// Write the content to the new window and trigger print
printWindow.document.open()
printWindow.document.write(printContent)
printWindow.document.close()

// Add event listener to close the window after printing
printWindow.addEventListener("afterprint", () => {
  printWindow.close()
})

      toast({
        title: "Export successful",
        description: "Prescription ready for printing",
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export failed",
        description: "Error exporting prescription.",
        variant: "destructive",
      })
    }
  }

  const handleRefillPrescription = async (originalPrescriptionId) => {
    try {
      console.log("Refilling prescription with ID:", originalPrescriptionId)

      // Show loading state
      toast({
        title: "Processing refill request...",
        description: "Please wait",
      })

      if (!patient || !patient.prescriptions) {
        console.error("Patient or prescriptions data not available")
        toast({
          title: "Refill failed",
          description: "Patient data not available",
          variant: "destructive",
        })
        return
      }

      // Get the original prescription data
      const originalPrescription = patient.prescriptions.find(
        (p) => p._id === originalPrescriptionId || p.id === originalPrescriptionId,
      )

      console.log("Found prescription to refill:", originalPrescription)

      if (!originalPrescription) {
        toast({
          title: "Refill failed",
          description: "Could not find the original prescription",
          variant: "destructive",
        })
        return
      }

      // Open the new prescription form
      setDiagnosis(originalPrescription.diagnosis || "")
      setClinicalNotes(originalPrescription.clinicalNotes || "")
      setSpecialInstructions(originalPrescription.specialInstructions || "")
      setFollowUp(originalPrescription.followUp || "")

      // Copy medications
      const newMedications = []
      if (originalPrescription.medications && originalPrescription.medications.length > 0) {
        originalPrescription.medications.forEach((med) => {
          newMedications.push({
            medicine: med.medicine || "",
            dosage: med.dosage || "",
            duration: med.duration || "",
            instructions: med.instructions || med.notes || "",
          })
        })
      } else {
        // Add empty medication slots if none exist
        newMedications.push({ medicine: "", dosage: "", duration: "", instructions: "" })
        newMedications.push({ medicine: "", dosage: "", duration: "", instructions: "" })
      }

      // Update medications state
      console.log("Setting medications for refill:", newMedications)
      setMedications(newMedications)

      // Mark as refill
      setIsRefill(true)
      setRefillDate(new Date().toISOString().split("T")[0])

      // Open the prescription form
      setShowPrescriptionForm(true)

      toast({
        title: "Prescription prepared for refill",
        description: "Review and save the refill prescription",
        variant: "default",
      })
    } catch (error) {
      console.error("Error preparing refill:", error)
      toast({
        title: "Refill preparation failed",
        description: "Could not prepare prescription for refill",
        variant: "destructive",
      })
    }
  }

  const handleDownloadLabReport = async (reportId: string) => {
    try {
      if (!reportId || reportId === "undefined") {
        toast({
          title: "Download failed",
          description: "Invalid lab report ID",
          variant: "destructive",
        })
        return
      }

      // Find the lab report
      const report = patient.labReports.find((r) => r._id === reportId || r.id === reportId || r.reportId === reportId)

      if (!report) {
        toast({
          title: "Download failed",
          description: "Lab report not found",
          variant: "destructive",
        })
        return
      }

      // Create the HTML content for printing
      const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>MEDITRACK - Lab Report for ${patient.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      :root {
        --primary-color: #2563eb;
        --secondary-color: #0f172a;
        --accent-color: #3b82f6;
        --light-color: #f8fafc;
        --border-color: #cbd5e0;
        --text-color: #334155;
        --heading-color: #1e40af;
        --normal-color: #10b981;
        --abnormal-color: #f59e0b;
        --critical-color: #ef4444;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Poppins', Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: #fff;
        position: relative;
        padding: 0;
        margin: 0;
      }
      
      .watermark {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 0;
      }
      
      .watermark::after {
        content: "MEDITRACK";
        font-size: 12rem;
        font-weight: 700;
        color: rgba(203, 213, 225, 0.15);
        transform: rotate(-45deg);
        letter-spacing: 0.5rem;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        position: relative;
        z-index: 1;
        background-color: #fff;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--primary-color);
      }
      
      .branding {
        display: flex;
        flex-direction: column;
      }
      
      .logo {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--primary-color);
        letter-spacing: 0.15rem;
      }
      
      .tagline {
        font-size: 0.85rem;
        color: var(--text-color);
        font-style: italic;
      }
      
      .report-id {
        background-color: var(--primary-color);
        color: white;
        padding: 8px 15px;
        border-radius: 5px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      
      .date-container {
        margin-top: 5px;
        text-align: right;
        font-size: 0.9rem;
      }
      
      .info-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .patient-info, .lab-info {
        background-color: var(--light-color);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .info-title {
        color: var(--heading-color);
        font-size: 1.25rem;
        margin-bottom: 15px;
        position: relative;
        padding-bottom: 8px;
      }
      
      .info-title::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background-color: var(--primary-color);
      }
      
      .info-item {
        margin-bottom: 8px;
        display: flex;
        align-items: baseline;
      }
      
      .info-label {
        font-weight: 600;
        color: var(--secondary-color);
        min-width: 120px;
      }
      
      .info-value {
        color: var(--text-color);
      }
      
      .section {
        margin-bottom: 30px;
      }
      
      .section-title {
        color: var(--heading-color);
        font-size: 1.2rem;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .summary {
        background-color: #e0f2fe;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid var(--accent-color);
        margin-bottom: 20px;
      }
      
      table {
        width: 100%;
        margin-bottom: 20px;
        border-collapse: collapse;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        overflow: hidden;
      }
      
      thead {
        background-color: var(--primary-color);
        color: white;
      }
      
      th {
        text-align: left;
        padding: 12px 15px;
        font-weight: 500;
      }
      
      tbody tr:nth-child(even) {
        background-color: #f1f5f9;
      }
      
      tbody tr:hover {
        background-color: #e2e8f0;
      }
      
      td {
        padding: 12px 15px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .normal {
        color: var(--normal-color);
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: rgba(16, 185, 129, 0.1);
      }
      
      .abnormal {
        color: var(--abnormal-color);
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: rgba(245, 158, 11, 0.1);
      }
      
      .critical {
        color: var(--critical-color);
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: rgba(239, 68, 68, 0.1);
      }
      
      .parameter-icon {
        font-size: 1.1rem;
        margin-right: 5px;
      }
      
      .status-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .reference-range {
        font-size: 0.9rem;
        color: #64748b;
      }
      
      .value {
        font-weight: 600;
      }
      
      .unit {
        font-size: 0.85rem;
        color: #64748b;
      }
      
      .report-metadata {
        display: flex;
        justify-content: space-between;
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      
      .metadata-column {
        flex: 1;
      }
      
      .metadata-item {
        margin-bottom: 8px;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
      }
      
      .footer-left {
        max-width: 60%;
      }
      
      .footer-text {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 8px;
      }
      
      .footer-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .signature-line {
        width: 200px;
        height: 1px;
        background-color: var(--text-color);
        margin-bottom: 5px;
      }
      
      .lab-signature {
        font-size: 0.85rem;
        color: var(--text-color);
        text-align: center;
      }
      
      .qr-placeholder {
        width: 80px;
        height: 80px;
        background-color: #f1f5f9;
        border: 1px dashed var(--border-color);
        margin-bottom: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 0.7rem;
        color: #64748b;
      }
      
      .digital-verification {
        font-size: 0.7rem;
        color: #64748b;
        text-align: center;
      }
      
      .print-button {
        display: block;
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin: 30px auto 0;
        font-weight: 600;
        transition: background-color 0.2s ease;
      }
      
      .print-button:hover {
        background-color: #1d4ed8;
      }
      
      .results-summary {
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        background-color: #f8fafc;
        border-left: 4px solid #64748b;
      }
      
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        .container {
          box-shadow: none;
          padding: 20px;
        }
        .no-print {
          display: none;
        }
        .watermark::after {
          font-size: 10rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="watermark"></div>
    
    <div class="container">
      <div class="header">
        <div class="branding">
          <div class="logo">MEDITRACK</div>
          <div class="tagline">Advanced Healthcare Solutions</div>
        </div>
        <div class="header-right">
          <div class="report-id">LAB-${Math.floor(100000 + Math.random() * 900000)}</div>
          <div class="date-container">${report.date}</div>
        </div>
      </div>
      
      <div class="info-container">
        <div class="patient-info">
          <h3 class="info-title">Patient Information</h3>
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${patient.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Patient ID:</span>
            <span class="info-value">${patient.patientId || patient.id || "N/A"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Age:</span>
            <span class="info-value">${patient.age} years</span>
          </div>
          <div class="info-item">
            <span class="info-label">Gender:</span>
            <span class="info-value">${patient.gender}</span>
          </div>
        </div>
        
        <div class="lab-info">
          <h3 class="info-title">Laboratory Information</h3>
          <div class="info-item">
            <span class="info-label">Report Name:</span>
            <span class="info-value">${report.name}</span>
          </div>
          ${
            report.category
              ? `
              <div class="info-item">
                <span class="info-label">Category:</span>
                <span class="info-value">${report.category}</span>
              </div>
            `
              : ""
          }
          <div class="info-item">
            <span class="info-label">Specimen ID:</span>
            <span class="info-value">SP-${Math.floor(10000 + Math.random() * 90000)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Collection Date:</span>
            <span class="info-value">${report.collectionDate || report.date}</span>
          </div>
        </div>
      </div>
      
      ${
        report.summary
          ? `
          <div class="section">
            <h3 class="section-title">Summary</h3>
            <div class="summary">
              ${report.summary}
            </div>
          </div>
        `
          : ""
      }
      
      ${
        report.parameters && report.parameters.length > 0
          ? `
          <div class="section">
            <h3 class="section-title">Parameters</h3>
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Result</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${report.parameters
                  .map(
                    (param) => `
                    <tr>
                      <td>${param.name}</td>
                      <td><span class="value">${param.value}</span> <span class="unit">${param.unit || ""}</span></td>
                      <td><span class="reference-range">${param.referenceRange || "N/A"}</span></td>
                      <td>
                        <div class="status-indicator ${param.status}">
                          ${
                            param.status === "normal"
                              ? '<span class="parameter-icon">✓</span>'
                              : param.status === "abnormal"
                              ? '<span class="parameter-icon">⚠️</span>'
                              : '<span class="parameter-icon">❗</span>'
                          }
                          ${param.status}
                        </div>
                      </td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div class="results-summary">
            <strong>Results Analysis:</strong> Based on the parameters tested, 
            ${(() => {
              const normal = report.parameters.filter(p => p.status === "normal").length;
              const abnormal = report.parameters.filter(p => p.status === "abnormal").length;
              const critical = report.parameters.filter(p => p.status === "critical").length;
              const total = report.parameters.length;
              
              if (critical > 0) {
                return `${critical} parameter(s) show critical values requiring immediate attention. ${abnormal} parameter(s) show abnormal values and ${normal} parameter(s) are within normal range.`;
              } else if (abnormal > 0) {
                return `${abnormal} parameter(s) show abnormal values requiring follow-up. ${normal} parameter(s) are within normal range.`;
              } else {
                return `all ${total} parameter(s) are within normal reference ranges.`;
              }
            })()}
          </div>
        `
          : ""
      }
      
      <div class="footer">
        <div class="footer-left">
          <p class="footer-text">This is a confidential laboratory report issued through the MEDITRACK system.</p>
          <p class="footer-text">Please consult with your healthcare provider for interpretation of results and further guidance.</p>
        </div>
        
        <div class="footer-right">
          <div class="qr-placeholder">Digital Seal</div>
          <div class="signature-line"></div>
          <div class="lab-signature">Laboratory Technician</div>
          <div class="digital-verification">Digitally verified by MEDITRACK</div>
        </div>
      </div>
      
      <div class="no-print">
        <button class="print-button" onclick="window.print()">
          Print Lab Report
        </button>
      </div>
    </div>
  </body>
  </html>
`

// Create a new window for printing
const printWindow = window.open("", "_blank")

if (!printWindow) {
  toast({
    title: "Print blocked",
    description: "Please allow pop-ups to print lab reports",
    variant: "destructive",
  })
  return
}

// Write the content to the new window and trigger print
printWindow.document.open()
printWindow.document.write(printContent)
printWindow.document.close()

// Add event listener to close the window after printing
printWindow.addEventListener("afterprint", () => {
  printWindow.close()
})

toast({
  title: "Download successful",
  description: "Lab report ready for printing",
})
    } catch (error) {
      console.error("Error downloading lab report:", error)
      toast({
        title: "Download failed",
        description: "There was an error generating the lab report",
        variant: "destructive",
      })
    }
  }

  const handleNewPrescription = () => {
    // Reset form fields for new prescription
    setIsRefill(false)
    setRefillDate("")
    setDiagnosis("")
    setClinicalNotes("")
    setSpecialInstructions("")
    setFollowUp("")
    setMedications([
      { medicine: "", dosage: "", duration: "", instructions: "" },
      { medicine: "", dosage: "", duration: "", instructions: "" },
    ])
    setShowPrescriptionForm(true)
  }

  const handleAddLabReport = () => {
    setShowLabReportForm(true)
    setLabReportName("")
    setLabReportDate(new Date().toISOString().split("T")[0])
    setLabReportCategory("")
    setLabReportSummary("")
    setLabParameters([
      { name: "", value: "", unit: "", status: "normal" },
      { name: "", value: "", unit: "", status: "normal" },
      { name: "", value: "", unit: "", status: "normal" },
    ])
  }

  const handleAddMedication = () => {
    setMedications([...medications, { medicine: "", dosage: "", duration: "", instructions: "" }])
  }

  const handleRemoveMedication = (index) => {
    const updatedMedications = [...medications]
    updatedMedications.splice(index, 1)
    setMedications(updatedMedications)
  }

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = { ...updatedMedications[index], [field]: value }
    setMedications(updatedMedications)
  }

  const handleAddParameter = () => {
    setLabParameters([...labParameters, { name: "", value: "", unit: "", status: "normal" }])
  }

  const handleParameterChange = (index, field, value) => {
    const updatedParams = [...labParameters]
    updatedParams[index][field] = value

    // If the field being changed is the name field, check for autocomplete suggestions
    if (field === "name") {
      // Find a matching lab test
      const matchingTest = allLabTests.find(
        (test) =>
          test.name.toLowerCase() === value.toLowerCase() || test.name.toLowerCase().includes(value.toLowerCase()),
      )

      // If we found a matching test, auto-populate the unit field
      if (matchingTest && matchingTest.units && matchingTest.units.length > 0) {
        updatedParams[index].unit = matchingTest.units[0]

        // Add toast notification to inform the user
        toast({
          title: "Lab parameter detected",
          description: `Auto-filled unit for ${matchingTest.name}`,
          variant: "default",
        })
      }
    }

    setLabParameters(updatedParams)
  }

  const handleDictate = () => {
    // In a real app, this would connect to the browser's speech recognition API
    toast({
      title: "Speech recognition activated",
      description: "Start speaking now...",
    })
  }

  const handleSubmitPrescription = async () => {
    try {
      // Validate required fields
      const validMedications = medications.filter((med) => med.medicine.trim() !== "")

      if (validMedications.length === 0) {
        toast({
          title: "No medications added",
          description: "Please add at least one medication to the prescription",
          variant: "destructive",
        })
        return
      }

      if (!diagnosis) {
        toast({
          title: "Diagnosis required",
          description: "Please enter a diagnosis for the prescription",
          variant: "destructive",
        })
        return
      }

      // Show loading state
      toast({
        title: "Saving prescription...",
        description: "Please wait while we save the prescription.",
      })

      // Log the patient object to debug
      console.log("Patient object:", patient)

      // Check if we have a MongoDB _id (24-char hex) or a custom patientId
      let patientIdToUse

      // Log the patient object to debug what IDs we have available
      console.log("Patient object for debugging:", patient)

      if (patient && patient._id && /^[0-9a-fA-F]{24}$/.test(patient._id)) {
        // We have a valid MongoDB ObjectId
        patientIdToUse = patient._id
        console.log("Using valid MongoDB _id:", patientIdToUse)
      } else {
        // We need to find the MongoDB _id by querying using the custom patientId
        // For now, display an error since we can't proceed without a valid _id
        toast({
          title: "MongoDB ID format error",
          description: "The patient data doesn't contain a valid MongoDB ID. This is required to save prescriptions.",
          variant: "destructive",
        })
        return
      }

      if (!patientIdToUse) {
        toast({
          title: "Patient ID missing",
          description: "Could not determine patient's MongoDB ID. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      // Prepare prescription data
      const prescriptionData = {
        patientId: patientIdToUse,
        date: new Date().toISOString(),
        diagnosis,
        clinicalNotes,
        specialInstructions,
        followUp,
        medications: validMedications,
        isRefill,
        refillDate: refillDate || null,
      }

      console.log("Sending prescription data:", prescriptionData)

      // Save prescription
      const response = await prescriptionService.createPrescription(prescriptionData)
      console.log("Prescription created:", response)

      // Fetch the newly created prescription's prescriptions for this patient
      try {
        // Get prescriptions for this patient using their MongoDB _id
        const prescriptionsData = await prescriptionService.getPatientPrescriptions(patient._id)
        console.log("Fetched prescriptions after save:", prescriptionsData)

        // Update the patient state with the new prescriptions
        setPatient((prev) => ({
          ...prev,
          prescriptions: prescriptionsData || [],
        }))

        toast({
          title: "Prescriptions updated",
          description: "New prescription has been added to the patient's record",
          variant: "default",
        })
      } catch (refreshError) {
        console.error("Error fetching prescriptions after save:", refreshError)
        // Even if refresh fails, don't show error to user since save was successful
      }

      toast({
        title: isRefill ? "Prescription refilled" : "Prescription created",
        description: "The prescription has been successfully saved",
        variant: "default",
      })

      handleCancelPrescription()
    } catch (error) {
      console.error("Error saving prescription:", error)
      toast({
        title: "Error saving prescription",
        description: "There was a problem saving the prescription. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelPrescription = () => {
    setShowPrescriptionForm(false)
    setIsRefill(false)
    setRefillDate("")
    // Reset form fields
    setDiagnosis("")
    setClinicalNotes("")
    setSpecialInstructions("")
    setFollowUp("")
    setMedications([
      { medicine: "", dosage: "", duration: "", instructions: "" },
      { medicine: "", dosage: "", duration: "", instructions: "" },
    ])
  }

  const handleSubmitLabReport = async () => {
    // Filter out empty parameters
    const validParameters = labParameters.filter((param) => param.name.trim() !== "")

    if (!labReportName) {
      toast({
        title: "Report name required",
        description: "Please enter a name for the lab report",
        variant: "destructive",
      })
      return
    }

    if (!labReportDate) {
      toast({
        title: "Report date required",
        description: "Please enter a date for the lab report",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Create a new lab report object that matches the backend expectation
    const newLabReport = {
      patientId: patient._id,
      name: labReportName,
      date: new Date(labReportDate),
      category: labReportCategory,
      findings: labReportSummary, // Use findings field for the backend
      parameters: validParameters,
      status: "completed",
    }

    try {
      // Save to MongoDB via API
      const savedLabReport = await labReportService.createLabReport(newLabReport)
      console.log("Lab report saved to MongoDB:", savedLabReport)

      // Create a frontend-friendly version of the lab report
      const frontendLabReport = {
        _id: savedLabReport._id,
        id: savedLabReport._id,
        name: labReportName,
        date: labReportDate,
        category: labReportCategory,
        summary: labReportSummary,
        parameters: validParameters,
        patientId: patient._id,
        status: "completed",
      }

      // Update patient state with the new lab report
      const updatedLabReports = [...(patient.labReports || []), frontendLabReport]
      setPatient((prev) => ({
        ...prev,
        labReports: updatedLabReports,
      }))

      // Also save to localStorage as backup
      try {
        localStorage.setItem(`labReports_${patient._id}`, JSON.stringify(updatedLabReports))
        console.log("Lab reports also saved to localStorage as backup:", updatedLabReports)
      } catch (error) {
        console.error("Error saving lab reports to localStorage:", error)
      }

      toast({
        title: "Lab report created",
        description: "The lab report has been successfully created",
        variant: "default",
      })

      // Reset form and hide it
      setLabReportName("")
      setLabReportDate("")
      setLabReportCategory("")
      setLabReportSummary("")
      setLabParameters([
        { name: "", value: "", unit: "", status: "normal" },
        { name: "", value: "", unit: "", status: "normal" },
      ])
      setShowLabReportForm(false)
    } catch (error) {
      console.error("Error creating lab report:", error)
      toast({
        title: "Failed to create lab report",
        description: "There was an error creating the lab report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelLabReport = () => {
    setShowLabReportForm(false)
    // Reset form fields
    setLabReportName("")
    setLabReportDate("")
    setLabReportCategory("")
    setLabReportSummary("")
    setLabParameters([
      { name: "", value: "", unit: "", status: "normal" },
      { name: "", value: "", unit: "", status: "normal" },
      { name: "", value: "", unit: "", status: "normal" },
    ])
  }

  const handlePrintPatientRecord = useCallback(() => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow pop-ups to print patient records",
        variant: "destructive",
      })
      return
    }

    // Get current date for the report header
    const currentDate = new Date().toLocaleDateString()

    // Format patient data for printing
    const patientAge = patient.age ? `${patient.age} years` : "N/A"
    const patientGender = patient.gender || "N/A"
    const patientPhone = patient.phone || "N/A"
    const patientAddress = patient.address || "N/A"

    // Format allergies
    const allergiesText =
      patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(", ") : "No known allergies"

    // Format medical history
    const medicalHistoryText =
      patient.medicalHistory && patient.medicalHistory.length > 0
        ? patient.medicalHistory.join(", ")
        : "No medical history recorded"

    // Format prescriptions
    let prescriptionsHtml = ""
    if (patient.prescriptions && patient.prescriptions.length > 0) {
      prescriptionsHtml = `
        <h3>Prescriptions</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f0f4f8;">
              <th style="text-align: left;">Date</th>
              <th style="text-align: left;">Diagnosis</th>
              <th style="text-align: left;">Medications</th>
              <th style="text-align: left;">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            ${patient.prescriptions
              .map((prescription) => {
                // Format date
                let displayDate = "Unknown Date"
                if (prescription.date) {
                  try {
                    displayDate = new Date(prescription.date).toLocaleDateString()
                  } catch (e) {
                    displayDate = String(prescription.date).split("T")[0] || "Unknown Date"
                  }
                }

                // Format medications
                let medicationsText = "None"
                if (prescription.medications && prescription.medications.length > 0) {
                  medicationsText = prescription.medications
                    .map((med) => `${med.medicine} (${med.dosage}, ${med.duration})`)
                    .join("<br>")
                }

                return `
                <tr>
                  <td>${displayDate}</td>
                  <td>${prescription.diagnosis || "N/A"}</td>
                  <td>${medicationsText}</td>
                  <td>${prescription.followUp || "N/A"}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      `
    } else {
      prescriptionsHtml = "<h3>Prescriptions</h3><p>No prescriptions recorded</p>"
    }

    // Format lab reports
    let labReportsHtml = ""
    if (patient.labReports && patient.labReports.length > 0) {
      labReportsHtml = `
        <h3>Lab Reports</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f0f4f8;">
              <th style="text-align: left;">Date</th>
              <th style="text-align: left;">Name</th>
              <th style="text-align: left;">Category</th>
              <th style="text-align: left;">Summary</th>
            </tr>
          </thead>
          <tbody>
            ${patient.labReports
              .map((report) => {
                return `
                <tr>
                  <td>${report.date || "N/A"}</td>
                  <td>${report.name || "N/A"}</td>
                  <td>${report.category || "N/A"}</td>
                  <td>${report.summary || "N/A"}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      `
    } else {
      labReportsHtml = "<h3>Lab Reports</h3><p>No lab reports recorded</p>"
    }

    // Format visits
    let visitsHtml = ""
    if (patient.visits && patient.visits.length > 0) {
      visitsHtml = `
        <h3>Visit History</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f0f4f8;">
              <th style="text-align: left;">Date</th>
              <th style="text-align: left;">Diagnosis</th>
              <th style="text-align: left;">Notes</th>
              <th style="text-align: left;">Vitals</th>
            </tr>
          </thead>
          <tbody>
            ${patient.visits
              .map((visit) => {
                // Format vitals
                const vitals = []
                if (visit.BP) vitals.push(`BP: ${visit.BP}`)
                if (visit.heartRate) vitals.push(`HR: ${visit.heartRate} bpm`)
                if (visit.temperature) vitals.push(`Temp: ${visit.temperature}°F`)
                if (visit.weight) vitals.push(`Weight: ${visit.weight} kg`)
                if (visit.height) vitals.push(`Height: ${visit.height} cm`)

                const vitalsText = vitals.length > 0 ? vitals.join("<br>") : "Not recorded"

                return `
                <tr>
                  <td>${visit.date || "N/A"}</td>
                  <td>${visit.diagnosis || "N/A"}</td>
                  <td>${visit.notes || "N/A"}</td>
                  <td>${vitalsText}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      `
    } else {
      visitsHtml = "<h3>Visit History</h3><p>No visits recorded</p>"
    }

    // Construct the HTML content for printing
    const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>MEDITRACK - Patient Record for ${patient.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      :root {
        --primary-color: #2563eb;
        --secondary-color: #0f172a;
        --accent-color: #3b82f6;
        --light-color: #f8fafc;
        --border-color: #cbd5e0;
        --text-color: #334155;
        --heading-color: #1e40af;
        --section-bg: #f1f5f9;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Poppins', Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: #fff;
        position: relative;
        padding: 0;
        margin: 0;
      }
      
      .watermark {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 0;
      }
      
      .watermark::after {
        content: "MEDITRACK";
        font-size: 12rem;
        font-weight: 700;
        color: rgba(203, 213, 225, 0.15);
        transform: rotate(-45deg);
        letter-spacing: 0.5rem;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        position: relative;
        z-index: 1;
        background-color: #fff;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--primary-color);
      }
      
      .branding {
        display: flex;
        flex-direction: column;
      }
      
      .logo {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--primary-color);
        letter-spacing: 0.15rem;
      }
      
      .tagline {
        font-size: 0.85rem;
        color: var(--text-color);
        font-style: italic;
      }
      
      .record-id {
        background-color: var(--primary-color);
        color: white;
        padding: 8px 15px;
        border-radius: 5px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      
      .date-container {
        margin-top: 5px;
        text-align: right;
        font-size: 0.9rem;
      }
      
      .patient-info {
        background-color: var(--light-color);
        border-radius: 10px;
        padding: 25px;
        margin-bottom: 30px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        position: relative;
        overflow: hidden;
      }
      
      .patient-info::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        background-color: var(--primary-color);
      }
      
      .patient-name {
        color: var(--heading-color);
        font-size: 1.8rem;
        margin-bottom: 15px;
      }
      
      .patient-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .info-item {
        margin-bottom: 10px;
        display: flex;
        align-items: baseline;
      }
      
      .info-label {
        font-weight: 600;
        color: var(--secondary-color);
        min-width: 100px;
        position: relative;
      }
      
      .info-value {
        color: var(--text-color);
      }
      
      .section {
        margin-bottom: 30px;
      }
      
      .section-title {
        color: var(--heading-color);
        font-size: 1.3rem;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
      }
      
      .section-title-icon {
        margin-right: 10px;
        color: var(--primary-color);
        font-size: 1.2rem;
      }
      
      .medical-info {
        background-color: var(--section-bg);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
      }
      
      .medical-tag {
        display: inline-block;
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.9rem;
        margin-right: 5px;
        margin-bottom: 5px;
      }
      
      .visit-card {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
        transition: transform 0.2s ease;
      }
      
      .visit-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .visit-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px dashed var(--border-color);
      }
      
      .visit-date {
        font-weight: 600;
        color: var(--heading-color);
      }
      
      .visit-doctor {
        color: var(--text-color);
        font-size: 0.9rem;
      }
      
      .visit-notes {
        color: var(--text-color);
        padding-top: 5px;
      }
      
      table {
        width: 100%;
        margin-bottom: 20px;
        border-collapse: collapse;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        overflow: hidden;
      }
      
      thead {
        background-color: var(--primary-color);
        color: white;
      }
      
      th {
        text-align: left;
        padding: 12px 15px;
        font-weight: 500;
      }
      
      tbody tr:nth-child(even) {
        background-color: #f1f5f9;
      }
      
      tbody tr:hover {
        background-color: #e2e8f0;
      }
      
      td {
        padding: 12px 15px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .record-section {
        margin-bottom: 30px;
        padding: 20px;
        background-color: var(--light-color);
        border-radius: 8px;
      }
      
      .record-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
      }
      
      @media (max-width: 768px) {
        .record-grid {
          grid-template-columns: 1fr;
        }
      }
      
      .record-card {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease;
      }
      
      .record-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .record-card-title {
        font-weight: 600;
        color: var(--heading-color);
        margin-bottom: 5px;
        font-size: 1rem;
      }
      
      .record-card-date {
        font-size: 0.8rem;
        color: #64748b;
        margin-bottom: 10px;
      }
      
      .record-card-content {
        color: var(--text-color);
        font-size: 0.9rem;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
        text-align: center;
      }
      
      .footer-text {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 8px;
      }
      
      .verification-seal {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
      }
      
      .qr-placeholder {
        width: 80px;
        height: 80px;
        background-color: #f1f5f9;
        border: 1px dashed var(--border-color);
        margin-right: 15px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 0.7rem;
        color: #64748b;
      }
      
      .verification-info {
        text-align: left;
      }
      
      .verification-title {
        font-weight: 600;
        color: var(--heading-color);
        margin-bottom: 5px;
      }
      
      .verification-detail {
        font-size: 0.8rem;
        color: #64748b;
      }
      
      .print-button {
        display: block;
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin: 30px auto 0;
        font-weight: 600;
        transition: background-color 0.2s ease;
      }
      
      .print-button:hover {
        background-color: #1d4ed8;
      }
      
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        .container {
          box-shadow: none;
          padding: 20px;
        }
        .no-print {
          display: none;
        }
        .watermark::after {
          font-size: 10rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="watermark"></div>
    
    <div class="container">
      <div class="header">
        <div class="branding">
          <div class="logo">MEDITRACK</div>
          <div class="tagline">Advanced Healthcare Solutions</div>
        </div>
        <div class="header-right">
          <div class="record-id">MR-${Math.floor(100000 + Math.random() * 900000)}</div>
          <div class="date-container">Generated on ${currentDate}</div>
        </div>
      </div>
      
      <div class="patient-info">
        <h2 class="patient-name">${patient.name}</h2>
        <div class="patient-info-grid">
          <div class="info-item">
            <span class="info-label">Patient ID:</span>
            <span class="info-value">${patient.patientId || patient.id || "N/A"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Age:</span>
            <span class="info-value">${patientAge}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Gender:</span>
            <span class="info-value">${patientGender}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">${patientPhone}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Address:</span>
            <span class="info-value">${patientAddress}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">
          <span class="section-title-icon">⚠️</span>
          Medical Information
        </h3>
        <div class="medical-info">
          <div class="info-item">
            <span class="info-label">Allergies:</span>
            <div class="info-value">
              ${patient.allergies && patient.allergies.length > 0 
                ? patient.allergies.map(allergy => `<span class="medical-tag">${allergy}</span>`).join('')
                : "No known allergies"}
            </div>
          </div>
          <div class="info-item" style="margin-top: 15px;">
            <span class="info-label">Medical History:</span>
            <div class="info-value">
              ${patient.medicalHistory && patient.medicalHistory.length > 0 
                ? patient.medicalHistory.map(condition => `<span class="medical-tag">${condition}</span>`).join('')
                : "No significant medical history"}
            </div>
          </div>
        </div>
      </div>
      
      ${
        patient.visits && patient.visits.length > 0
          ? `
          <div class="section">
            <h3 class="section-title">
              <span class="section-title-icon">🗓️</span>
              Visit History
            </h3>
            <div class="visits-container">
              ${visitsHtml || patient.visits.map(visit => `
                <div class="visit-card">
                  <div class="visit-header">
                    <div class="visit-date">${visit.date}</div>
                    <div class="visit-doctor">Dr. ${visit.doctor || "Healthcare Provider"}</div>
                  </div>
                  <div class="visit-reason"><strong>Reason:</strong> ${visit.reason || "Regular checkup"}</div>
                  <div class="visit-notes"><strong>Notes:</strong> ${visit.notes || "No notes provided"}</div>
                </div>
              `).join('')}
            </div>
          </div>
          `
          : ""
      }
      
      ${
        patient.prescriptions && patient.prescriptions.length > 0
          ? `
          <div class="section">
            <h3 class="section-title">
              <span class="section-title-icon">💊</span>
              Prescriptions
            </h3>
            <div class="record-section">
              ${prescriptionsHtml || `
                <div class="record-grid">
                  ${patient.prescriptions.map(prescription => `
                    <div class="record-card">
                      <div class="record-card-title">${prescription.diagnosis || "Prescription"}</div>
                      <div class="record-card-date">${prescription.date}</div>
                      <div class="record-card-content">
                        ${prescription.medications && prescription.medications.length > 0
                          ? prescription.medications.map(med => `
                              <div style="margin-bottom: 5px;">• ${med.medicine} (${med.dosage})</div>
                            `).join('')
                          : "No medications prescribed"
                        }
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          `
          : ""
      }
      
      ${
        labReports && labReports.length > 0
          ? `
          <div class="section">
            <h3 class="section-title">
              <span class="section-title-icon">🔬</span>
              Laboratory Reports
            </h3>
            <div class="record-section">
              ${labReportsHtml || `
                <div class="record-grid">
                  ${labReports.map(report => `
                    <div class="record-card">
                      <div class="record-card-title">${report.name}</div>
                      <div class="record-card-date">${report.date}</div>
                      <div class="record-card-content">
                        ${report.summary || report.parameters && report.parameters.length > 0
                          ? report.summary || `${report.parameters.length} parameters measured`
                          : "No details available"
                        }
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          `
          : ""
      }
      
      <div class="verification-seal">
        <div class="qr-placeholder">Digital Seal</div>
        <div class="verification-info">
          <div class="verification-title">Verified Medical Record</div>
          <div class="verification-detail">Generated by MEDITRACK Healthcare System</div>
          <div class="verification-detail">Document ID: MR-${Math.floor(100000 + Math.random() * 900000)}</div>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">This is a confidential medical record. Please handle according to privacy regulations.</p>
        <p class="footer-text">© MEDITRACK Healthcare Systems - ${new Date().getFullYear()}</p>
      </div>
      
      <div class="no-print">
        <button class="print-button" onclick="window.print()">
          Print Medical Record
        </button>
      </div>
    </div>
  </body>
  </html>
`

// Write the content to the new window and trigger print
printWindow.document.open()
printWindow.document.write(printContent)
printWindow.document.close()

// Add event listener to close the window after printing
printWindow.addEventListener("afterprint", () => {
  printWindow.close()
})

// Notify the user
toast({
  title: "Print preview ready",
  description: "The print preview has been generated in a new tab",
})
}, [patient])

  // Render the lab report form if needed
  if (showLabReportForm) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-blue-50 transition-colors shadow-sm"
              onClick={handleCancelLabReport}
            >
              <ArrowLeft size={18} />
            </Button>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-900">New Lab Report</h1>
              <p className="text-muted-foreground">Creating a lab report for {patient.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Information Card */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <User size={18} />
                Patient Information
              </CardTitle>
            </div>

            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                  {getPatientInitials(patient.name)}
                </div>

                <div>
                  <h3 className="font-medium text-lg">{patient.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                      ID: {patient.patientId || patient.id}
                    </Badge>
                    <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                      {patient.age} years
                    </Badge>
                    <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                      {patient.gender}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {patient.visits && patient.visits.length > 0 ? (
                  <>
                    <InfoItem
                      icon={<HeartPulse size={16} className="text-red-500" />}
                      label="Blood Pressure"
                      value={patient.visits[0].BP || "120/80 mmHg"}
                    />
                    <InfoItem
                      icon={<Activity size={16} className="text-blue-500" />}
                      label="Pulse"
                      value={`${patient.visits[0].heartRate || "72"} bpm`}
                    />
                  </>
                ) : (
                  <>
                    <InfoItem
                      icon={<HeartPulse size={16} className="text-red-500" />}
                      label="Blood Pressure"
                      value="120/80 mmHg"
                    />
                    <InfoItem icon={<Activity size={16} className="text-blue-500" />} label="Pulse" value="72 bpm" />
                  </>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Allergies
                </h4>
                {patient.allergies?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No known allergies</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <Activity size={14} />
                  Medical History
                </h4>
                {patient.medicalHistory?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalHistory.map((history, index) => (
                      <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {history}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No medical history recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lab Report Form Card */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <ClipboardList size={18} />
                Lab Report Details
              </CardTitle>
            </div>

            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lab-name" className="text-sm font-medium">
                    Report Name
                  </Label>
                  <Input
                    id="lab-name"
                    placeholder="Enter report name"
                    value={labReportName}
                    onChange={(e) => setLabReportName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lab-date" className="text-sm font-medium">
                    Report Date
                  </Label>
                  <Input
                    id="lab-date"
                    type="date"
                    value={labReportDate}
                    onChange={(e) => setLabReportDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lab-category" className="text-sm font-medium">
                  Category
                </Label>
                <Select value={labReportCategory} onValueChange={setLabReportCategory}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hematology">Hematology</SelectItem>
                    <SelectItem value="biochemistry">Biochemistry</SelectItem>
                    <SelectItem value="microbiology">Microbiology</SelectItem>
                    <SelectItem value="immunology">Immunology</SelectItem>
                    <SelectItem value="urinalysis">Urinalysis</SelectItem>
                    <SelectItem value="radiology">Radiology</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="lab-summary" className="text-sm font-medium">
                    Summary/Findings
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 bg-white hover:bg-blue-50"
                    onClick={handleDictate}
                  >
                    <Mic className="h-3.5 w-3.5 mr-1" />
                    Dictate
                  </Button>
                </div>
                <Textarea
                  id="lab-summary"
                  placeholder="Enter summary or findings"
                  className="min-h-[100px] mt-1"
                  value={labReportSummary}
                  onChange={(e) => setLabReportSummary(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Parameters</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 bg-white hover:bg-blue-50"
                    onClick={handleAddParameter}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-3">
                  {labParameters.map((param, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 p-3 rounded-md bg-blue-50/50 border border-blue-100"
                    >
                      <div className="col-span-4 relative">
                        <div className="relative">
                          <Input
                            placeholder="Parameter name"
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, "name", e.target.value)}
                            list={`parameter-suggestions-${index}`}
                            className="bg-white"
                          />
                          <datalist id={`parameter-suggestions-${index}`}>
                            {/* Add suggestions based on common lab tests */}
                            {allLabTests.map((test, testIndex) => (
                              <option key={testIndex} value={test.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => handleParameterChange(index, "value", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Unit"
                          value={param.unit}
                          onChange={(e) => handleParameterChange(index, "unit", e.target.value)}
                          list={`unit-suggestions-${index}`}
                          className="bg-white"
                        />
                        <datalist id={`unit-suggestions-${index}`}>
                          {/* Find the matching test and show its unit options */}
                          {allLabTests
                            .find((test) => test.name === param.name)
                            ?.units.map((unit, unitIndex) => <option key={unitIndex} value={unit} />) || []}
                        </datalist>
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={param.status}
                          onValueChange={(value) => handleParameterChange(index, "status", value)}
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="abnormal">Abnormal</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCancelLabReport} className="bg-white hover:bg-gray-50">
                  Cancel
                </Button>
                <Button onClick={handleSubmitLabReport} className="bg-blue-600 hover:bg-blue-700">
                  Create Lab Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render the prescription form if needed
  if (showPrescriptionForm) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-blue-50 transition-colors shadow-sm"
              onClick={handleCancelPrescription}
            >
              <ArrowLeft size={18} />
            </Button>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-900">
                {isRefill ? `Refill Prescription (${refillDate})` : "New Prescription"}
              </h1>
              <p className="text-muted-foreground">
                {isRefill
                  ? `Refilling prescription for ${patient.name}`
                  : `Creating a prescription for ${patient.name}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Information Card */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <User size={18} />
                Patient Information
              </CardTitle>
            </div>

            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                  {getPatientInitials(patient.name)}
                </div>

                <div>
                  <h3 className="font-medium text-lg">{patient.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                      ID: {patient.patientId || patient.id}
                    </Badge>
                    <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                      {patient.age} years
                    </Badge>
                    <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                      {patient.gender}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {patient.visits && patient.visits.length > 0 ? (
                  <>
                    <InfoItem
                      icon={<HeartPulse size={16} className="text-red-500" />}
                      label="Blood Pressure"
                      value={patient.visits[0].BP || "120/80 mmHg"}
                    />
                    <InfoItem
                      icon={<Activity size={16} className="text-blue-500" />}
                      label="Pulse"
                      value={`${patient.visits[0].heartRate || "72"} bpm`}
                    />
                    <InfoItem
                      icon={<Thermometer size={16} className="text-orange-500" />}
                      label="Temperature"
                      value={`${patient.visits[0].temperature || "98.6"}°F`}
                    />
                    <InfoItem
                      icon={<Wind size={16} className="text-green-500" />}
                      label="Weight"
                      value={`${patient.visits[0].weight || "70"} kg`}
                    />
                  </>
                ) : (
                  <>
                    <InfoItem
                      icon={<HeartPulse size={16} className="text-red-500" />}
                      label="Blood Pressure"
                      value="120/80 mmHg"
                    />
                    <InfoItem icon={<Activity size={16} className="text-blue-500" />} label="Pulse" value="72 bpm" />
                    <InfoItem
                      icon={<Thermometer size={16} className="text-orange-500" />}
                      label="Temperature"
                      value="98.6°F"
                    />
                    <InfoItem
                      icon={<Wind size={16} className="text-green-500" />}
                      label="Respiratory Rate"
                      value="16/min"
                    />
                  </>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Allergies
                </h4>
                {patient.allergies?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No known allergies</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <Activity size={14} />
                  Medical History
                </h4>
                {patient.medicalHistory?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalHistory.map((history, index) => (
                      <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {history}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No medical history recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescription Form Card */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                <FileText size={18} />
                Prescription Details
              </CardTitle>
            </div>

            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="diagnosis" className="text-sm font-medium">
                  Diagnosis
                </Label>
                <Input
                  id="diagnosis"
                  placeholder="Enter diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="clinical-notes" className="text-sm font-medium">
                    Clinical Notes
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 bg-white hover:bg-blue-50"
                    onClick={handleDictate}
                  >
                    <Mic className="h-3.5 w-3.5 mr-1" />
                    Dictate
                  </Button>
                </div>
                <Textarea
                  id="clinical-notes"
                  placeholder="Enter clinical notes or use dictation"
                  className="min-h-[100px] mt-1"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Medications</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 bg-white hover:bg-blue-50"
                      onClick={() => setShowMedicationSuggestions(!showMedicationSuggestions)}
                    >
                      {showMedicationSuggestions ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      Suggestions
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 bg-white hover:bg-blue-50"
                    onClick={handleAddMedication}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Medication
                  </Button>
                </div>

                {/* Medication Suggestions Panel */}
                {showMedicationSuggestions && (
                  <div className="mb-4 bg-white border border-blue-100 rounded-md shadow-sm p-3">
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-blue-700">Common Medications</h4>
                      <p className="text-xs text-muted-foreground">Click on a medication to add it to your prescription</p>
                    </div>
                    
                    {/* Search bar for medications */}
                    <div className="mb-3 relative">
                      <Input 
                        type="text" 
                        placeholder="Search medications..." 
                        className="pl-8 bg-white"
                        onChange={(e) => setMedicationSearchQuery(e.target.value)}
                      />
                      <div className="absolute left-2.5 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {commonMedications
                        .filter(med => {
                          if (!medicationSearchQuery) return true;
                          const query = medicationSearchQuery.toLowerCase();
                          return (
                            med.medicine.toLowerCase().includes(query) || 
                            (med.conditions && Array.isArray(med.conditions) && med.conditions.some(c => c && typeof c === 'string' && c.toLowerCase().includes(query)))
                          );
                        })
                        .map((med, idx) => (
                        <div 
                          key={idx}
                          className="p-2 border border-blue-100 rounded bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                          onClick={() => {
                            // Apply the selected medication to the form
                            const applySuggestion = () => {
                              // Find the first empty medication slot or use the first one
                              const emptyIndex = medications.findIndex(m => !m.medicine);
                              const targetIndex = emptyIndex !== -1 ? emptyIndex : 0;
                              
                              // Create a new medications array with the updated medication
                              const updatedMedications = [...medications];
                              updatedMedications[targetIndex] = {
                                medicine: med.medicine,
                                dosage: med.dosage,
                                duration: med.duration,
                                instructions: med.instructions
                              };
                              
                              // Update the entire medications array at once
                              setMedications(updatedMedications);
                              
                              // Show a success toast
                              toast({
                                title: "Medication Added",
                                description: `${med.medicine} has been added to your prescription.`,
                                duration: 3000,
                              });
                            };
                            
                            // Execute the function
                            applySuggestion();
                          }}
                        >
                          <div className="font-medium text-sm">{med.medicine}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                            <span className="bg-blue-100 px-1 rounded text-blue-700">{med.dosage}</span>
                            <span className="bg-blue-100 px-1 rounded text-blue-700">{med.duration}</span>
                          </div>
                          <div className="text-xs mt-1 line-clamp-2">{med.instructions}</div>
                          {med.conditions && med.conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {med.conditions.map((condition, cidx) => (
                                <span key={cidx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {medications.map((med, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 group relative p-3 rounded-md bg-blue-50/50 border border-blue-100"
                    >
                      <div className="md:col-span-5">
                        <Input
                          placeholder="Medicine name"
                          value={med.medicine}
                          onChange={(e) => handleMedicationChange(index, "medicine", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Duration"
                          value={med.duration}
                          onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="md:col-span-3 relative">
                        <Input
                          placeholder="Instructions"
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                          className="bg-white"
                        />
                        {medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveMedication(index)}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="special-instructions" className="text-sm font-medium">
                  Special Instructions
                </Label>
                <Textarea
                  id="special-instructions"
                  placeholder="Enter any special instructions"
                  className="mt-1"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="follow-up" className="text-sm font-medium">
                  Follow-up Plan
                </Label>
                <Input
                  id="follow-up"
                  placeholder="Enter follow-up plan (e.g., 2 weeks)"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCancelPrescription} className="bg-white hover:bg-gray-50">
                  Cancel
                </Button>
                <Button onClick={handleSubmitPrescription} className="bg-blue-600 hover:bg-blue-700">
                  {isRefill ? "Issue Refill" : "Create Prescription"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-blue-50 transition-colors shadow-sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-900">Loading patient data...</h1>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    )
  }

  // Handle case where patient data is null
  if (!patient) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-blue-50 transition-colors shadow-sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-900">Patient Not Found</h1>
              <p className="text-muted-foreground">Unable to load patient data. Please try again.</p>
            </div>
          </div>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
            <h3 className="text-lg font-medium text-center">Error Loading Patient</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-md">
              There was a problem loading the patient data. Please go back and try again.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate(-1)}
            >
              Return to Patient List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular patient details view
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-blue-50 transition-colors shadow-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">{patient.name}</h1>
            <p className="text-muted-foreground">Patient ID: {patient.patientId || patient.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrintPatientRecord}
              className="bg-white hover:bg-blue-50 border-blue-200"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Record
            </Button>
            <Button
              variant="outline"
              onClick={handleNewPrescription}
              className="bg-white hover:bg-blue-50 border-blue-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Button>
            <Button onClick={handleAddLabReport} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Lab Report
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
            <CardTitle className="text-lg font-medium text-white">Patient Overview</CardTitle>
          </div>

          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {getPatientInitials(patient.name)}
              </div>

              <div>
                <h3 className="font-medium text-lg">{patient.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                    {patient.age} years
                  </Badge>
                  <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                    {patient.gender}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <InfoItem icon={<Phone size={16} className="text-blue-500" />} label="Phone" value={patient.phone} />
              <InfoItem icon={<MapPin size={16} className="text-blue-500" />} label="Address" value={patient.address} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {patient.visits && patient.visits.length > 0 ? (
                <>
                  <InfoItem
                    icon={<HeartPulse size={16} className="text-red-500" />}
                    label="Blood Pressure"
                    value={patient.visits[0].BP || "120/80 mmHg"}
                  />
                  <InfoItem
                    icon={<Activity size={16} className="text-blue-500" />}
                    label="Pulse"
                    value={`${patient.visits[0].heartRate || "72"} bpm`}
                  />
                  <InfoItem
                    icon={<Thermometer size={16} className="text-orange-500" />}
                    label="Temperature"
                    value={`${patient.visits[0].temperature || "98.6"}°F`}
                  />
                  <InfoItem
                    icon={<Wind size={16} className="text-green-500" />}
                    label="Weight"
                    value={`${patient.visits[0].weight || "70"} kg`}
                  />
                </>
              ) : (
                <>
                  <InfoItem
                    icon={<HeartPulse size={16} className="text-red-500" />}
                    label="Blood Pressure"
                    value="120/80 mmHg"
                  />
                  <InfoItem icon={<Activity size={16} className="text-blue-500" />} label="Pulse" value="72 bpm" />
                  <InfoItem
                    icon={<Thermometer size={16} className="text-orange-500" />}
                    label="Temperature"
                    value="98.6°F"
                  />
                  <InfoItem
                    icon={<Wind size={16} className="text-green-500" />}
                    label="Respiratory Rate"
                    value="16/min"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
            <CardTitle className="text-lg font-medium text-white">Medical History</CardTitle>
          </div>

          <CardContent className="space-y-4 pt-6">
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                <AlertCircle size={14} />
                Allergies
              </h4>
              {patient.allergies?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No known allergies</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                <Activity size={14} />
                Conditions
              </h4>
              {patient.medicalHistory?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.medicalHistory.map((history, index) => (
                    <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {history}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No medical conditions recorded</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                <Shield size={14} />
                Family History
              </h4>
              {patient.familyHistory?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.familyHistory.map((history, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {history}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No family history recorded</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-0 bg-transparent gap-2">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-lg border border-muted py-2 px-3"
              >
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="prescriptions"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-lg border border-muted py-2 px-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger
                value="lab-reports"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-lg border border-muted py-2 px-3"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Lab Reports
              </TabsTrigger>
              <TabsTrigger
                value="vitals-analytics"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-lg border border-muted py-2 px-3"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Vitals Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {patient.visits?.length > 0 ? (
                patient.visits.map((visit, index) => (
                  <Card key={index} className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-blue-600" />
                          <span>Visit on {visit.date}</span>
                        </div>
                        <Badge variant="outline" className="font-medium">
                          {visit.visitType || "Consultation"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {visit.diagnosis && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</h4>
                          <p className="text-sm">{visit.diagnosis}</p>
                        </div>
                      )}

                      {visit.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                          <p className="text-sm">{visit.notes}</p>
                        </div>
                      )}

                      {visit.prescriptions && visit.prescriptions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Prescriptions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {visit.prescriptions.map((prescription, pIndex) => (
                              <div key={pIndex} className="p-2 rounded-md bg-blue-50 border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{prescription.medicine}</p>
                                  <Badge variant="outline" className="text-xs bg-blue-100 border-blue-200">
                                    {prescription.duration}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {prescription.dosage} - {prescription.instructions}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border shadow-sm bg-muted/30">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileX className="h-12 w-12 text-muted-foreground/70 mb-3" />
                    <h3 className="text-lg font-medium text-center">No Visit Records</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 max-w-md">
                      There are no visit records for this patient yet. You can add visit records to keep track of
                      consultations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              {patient.prescriptions?.length > 0 ? (
                patient.prescriptions.map((prescription, index) => {
                  // Display date in simple format
                  let displayDate = "Unknown Date"
                  if (prescription.date) {
                    try {
                      displayDate = new Date(prescription.date).toLocaleDateString()
                    } catch (e) {
                      displayDate = String(prescription.date).split("T")[0] || "Unknown Date"
                    }
                  }

                  return (
                    <Card key={index} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardTitle className="text-lg font-medium flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <FileText size={18} className="text-blue-600" />
                            </div>
                            <span>Prescription - {displayDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-white hover:bg-blue-50"
                              onClick={() => handleExportPrescription(prescription._id || prescription.id)}
                            >
                              <Download className="mr-1 h-3.5 w-3.5" />
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-white hover:bg-blue-50"
                              onClick={() => handleRefillPrescription(prescription._id || prescription.id)}
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" />
                              Refill
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-4">
                        {prescription.diagnosis && (
                          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                            <h4 className="text-sm font-medium text-blue-700 mb-1">Diagnosis</h4>
                            <p className="text-sm font-medium">{prescription.diagnosis}</p>
                          </div>
                        )}

                        {prescription.clinicalNotes && (
                          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                            <h4 className="text-sm font-medium text-blue-700 mb-1">Clinical Notes</h4>
                            <p className="text-sm">{prescription.clinicalNotes}</p>
                          </div>
                        )}

                        {/* Medications Section */}
                        <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-700 mb-2">Medications</h4>
                          {prescription.medications && prescription.medications.length > 0 ? (
                            <div className="space-y-2">
                              {prescription.medications.map((medication, mIndex) => (
                                <div key={mIndex} className="p-3 rounded-md bg-blue-50 border border-blue-100">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-blue-800">{medication.medicine}</p>
                                    <Badge variant="outline" className="bg-blue-100 border-blue-200 text-blue-800">
                                      {medication.duration}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {medication.dosage} - {medication.instructions || medication.notes || ""}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No medications prescribed</p>
                          )}
                        </div>

                        {prescription.specialInstructions && (
                          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                            <h4 className="text-sm font-medium text-blue-700 mb-1">Special Instructions</h4>
                            <p className="text-sm">{prescription.specialInstructions}</p>
                          </div>
                        )}

                        {prescription.followUp && (
                          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                            <h4 className="text-sm font-medium text-blue-700 mb-1">Follow-up</h4>
                            <p className="text-sm">In {prescription.followUp}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className="border shadow-sm bg-muted/30">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileX className="h-12 w-12 text-muted-foreground/70 mb-3" />
                    <h3 className="text-lg font-medium text-center">No Prescriptions</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 max-w-md">
                      There are no prescriptions for this patient yet. Click on "New Prescription" to create one.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lab-reports" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button onClick={handleAddLabReport} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lab Report
                </Button>
              </div>
              {patient.labReports?.length > 0 ? (
                // Sort lab reports by date (latest first)
                [...patient.labReports]
                  .sort((a, b) => {
                    // Convert dates to comparable format
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    // Sort in descending order (latest first)
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((report, index) => (
                  <Card key={index} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <CardTitle className="text-lg font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <ClipboardList size={18} className="text-blue-600" />
                          </div>
                          <span>{report.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-medium bg-white">
                            {report.date}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-white hover:bg-blue-50"
                            onClick={() => handleDownloadLabReport(report._id || report.id || report.reportId)}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-4">
                      {report.category && (
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-blue-700">Category:</h4>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {report.category}
                          </Badge>
                        </div>
                      )}

                      {report.summary && (
                        <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-700 mb-1">Summary</h4>
                          <p className="text-sm">{report.summary}</p>
                        </div>
                      )}

                      {report.parameters && report.parameters.length > 0 && (
                        <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-700 mb-2">Parameters</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="text-left p-2 text-sm font-medium text-blue-700">Parameter</th>
                                  <th className="text-left p-2 text-sm font-medium text-blue-700">Value</th>
                                  <th className="text-left p-2 text-sm font-medium text-blue-700">Reference Range</th>
                                  <th className="text-left p-2 text-sm font-medium text-blue-700">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.parameters.map((param, pIndex) => (
                                  <tr key={pIndex} className="border-t hover:bg-gray-50">
                                    <td className="p-2 text-sm font-medium">{param.name}</td>
                                    <td className="p-2 text-sm">
                                      {param.value} {param.unit}
                                    </td>
                                    <td className="p-2 text-sm">{param.referenceRange || "N/A"}</td>
                                    <td className="p-2">
                                      <Badge
                                        variant="outline"
                                        className={
                                          param.status === "normal"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : param.status === "abnormal"
                                              ? "bg-amber-50 text-amber-700 border-amber-200"
                                              : "bg-red-50 text-red-700 border-red-200"
                                        }
                                      >
                                        {param.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border shadow-sm bg-muted/30">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileX className="h-12 w-12 text-muted-foreground/70 mb-3" />
                    <h3 className="text-lg font-medium text-center">No Lab Reports</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 max-w-md">
                      There are no lab reports for this patient yet. Click on "Add Lab Report" to create one.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Vitals Analytics Tab */}
            <TabsContent value="vitals-analytics" className="mt-6">
              {patient && patient.visits && patient.visits.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <LineChartIcon className="h-5 w-5 text-blue-600" />
                      Vitals Trends Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Compare vital signs across different visits to track health trends over time.
                    </p>
                  </div>
                  
                  {/* Vitals Comparison Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blood Pressure Chart */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4 text-red-500" />
                          Blood Pressure Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={patient.visits.map(visit => {
                                const [systolic, diastolic] = visit.BP.split('/').map(Number);
                                return {
                                  date: new Date(visit.date).toLocaleDateString(),
                                  systolic: systolic || 0,
                                  diastolic: diastolic || 0,
                                  visit: new Date(visit.date).toLocaleDateString()
                                };
                              }).reverse()}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="systolic" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                activeDot={{ r: 6 }} 
                                name="Systolic"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="diastolic" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                activeDot={{ r: 6 }} 
                                name="Diastolic"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Heart Rate Chart */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <HeartPulse className="h-4 w-4 text-pink-500" />
                          Heart Rate Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={patient.visits.map(visit => ({
                                date: new Date(visit.date).toLocaleDateString(),
                                heartRate: visit.heartRate,
                                visit: new Date(visit.date).toLocaleDateString()
                              })).reverse()}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="heartRate" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                activeDot={{ r: 6 }} 
                                name="Heart Rate (BPM)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Temperature Chart */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          Temperature Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={patient.visits.map(visit => ({
                                date: new Date(visit.date).toLocaleDateString(),
                                temperature: visit.temperature,
                                visit: new Date(visit.date).toLocaleDateString()
                              })).reverse()}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="temperature" 
                                stroke="#f97316" 
                                strokeWidth={2}
                                activeDot={{ r: 6 }} 
                                name="Temperature (°F)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Weight Chart */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-green-500" />
                          Weight Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={patient.visits.map(visit => ({
                                date: new Date(visit.date).toLocaleDateString(),
                                weight: visit.weight,
                                visit: new Date(visit.date).toLocaleDateString()
                              })).reverse()}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                              />
                              <Legend />
                              <Bar 
                                dataKey="weight" 
                                fill="#22c55e" 
                                name="Weight (kg)"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Vitals Comparison Table */}
                  <Card className="shadow-sm mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-blue-600" />
                        Vitals Comparison Table
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="text-left p-2 text-sm font-medium text-blue-700">Visit Date</th>
                              <th className="text-left p-2 text-sm font-medium text-blue-700">BP</th>
                              <th className="text-left p-2 text-sm font-medium text-blue-700">Heart Rate</th>
                              <th className="text-left p-2 text-sm font-medium text-blue-700">Temperature</th>
                              <th className="text-left p-2 text-sm font-medium text-blue-700">Weight</th>
                              <th className="text-left p-2 text-sm font-medium text-blue-700">Height</th>
                              <th className="text-left p-2 text-sm font-medium text-blue-700">BMI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patient.visits.slice().reverse().map((visit, index) => (
                              <tr key={index} className="border-t hover:bg-gray-50">
                                <td className="p-2 text-sm font-medium">{new Date(visit.date).toLocaleDateString()}</td>
                                <td className="p-2 text-sm">{visit.BP}</td>
                                <td className="p-2 text-sm">{visit.heartRate} BPM</td>
                                <td className="p-2 text-sm">{visit.temperature}°F</td>
                                <td className="p-2 text-sm">{visit.weight} kg</td>
                                <td className="p-2 text-sm">{visit.height} cm</td>
                                <td className="p-2 text-sm">{visit.bmi || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border shadow-sm bg-muted/30">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground/70 mb-3" />
                    <h3 className="text-lg font-medium text-center">No Vitals Data</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 max-w-md">
                      There are no vitals records for this patient yet. Add a new visit with vitals data to see analytics.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden iframe for printing */}
      <iframe ref={printFrameRef} style={{ display: "none" }} title="Print Frame" />
    </div>
  )
}

export default PatientDetails
