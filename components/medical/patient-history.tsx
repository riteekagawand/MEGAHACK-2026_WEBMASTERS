"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  History, 
  Plus, 
  Edit, 
  Save, 
  X,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface PatientData {
  _id?: string;
  userId: string;
  personalInfo: {
    name?: string;
    age?: number;
    gender?: string;
    location?: string;
    phone?: string;
    email?: string;
  };
  medicalHistory: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

interface DiagnosisHistory {
  sessionId: string;
  finalDiagnosis?: {
    primaryDiagnosis: {
      condition: string;
      confidence: string;
    };
    urgencyLevel: string;
    clinicalNotes: string;
  };
  createdAt: string;
  status: string;
}

export function PatientHistory({ userId }: { userId: string }) {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [editData, setEditData] = useState<PatientData>({
    userId,
    personalInfo: {},
    medicalHistory: {
      conditions: [],
      medications: [],
      allergies: [],
      surgeries: [],
      familyHistory: []
    }
  });

  useEffect(() => {
    fetchPatientHistory();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPatientHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/medical/history?userId=${userId}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient history');
      }

      const result = await response.json();
      
      if (result.success) {
        setPatientData(result.data.patient);
        setDiagnosisHistory(result.data.diagnosisHistory);
        
        if (result.data.patient) {
          setEditData(result.data.patient);
        }
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
      toast.error('Failed to load patient history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/medical/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Failed to update patient information');
      }

      const result = await response.json();
      
      if (result.success) {
        setPatientData(result.data);
        setIsEditing(false);
        toast.success('Patient information updated successfully');
      }
    } catch (error) {
      console.error('Error updating patient info:', error);
      toast.error('Failed to update patient information');
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (field: keyof typeof editData.medicalHistory, value: string) => {
    if (value.trim()) {
      setEditData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          [field]: [...prev.medicalHistory[field], value.trim()]
        }
      }));
    }
  };

  const removeArrayItem = (field: keyof typeof editData.medicalHistory, index: number) => {
    setEditData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [field]: prev.medicalHistory[field].filter((_, i) => i !== index)
      }
    }));
  };

  const getUrgencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
            <span className="ml-3 font-poppins text-[#151616]">Loading patient history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Profile & History
            </CardTitle>
            <CardDescription className="font-poppins">
              Comprehensive medical history and diagnosis tracking
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="reverse"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="border-2 border-[#151616]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#f9c80e] hover:bg-[#f9c80e]/90 text-[#151616] border-2 border-[#151616] font-poppins"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="reverse"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-2 border-[#151616]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Patient Profile</TabsTrigger>
            <TabsTrigger value="history">Diagnosis History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-poppins font-bold text-[#151616]">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-poppins text-[#151616]">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData.personalInfo.name || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="border-2 border-[#151616]"
                      placeholder="Enter full name"
                    />
                  ) : (
                    <p className="font-poppins text-[#151616] p-2 bg-[#FFFFF4] rounded-lg">
                      {patientData?.personalInfo.name || 'Not provided'}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="font-poppins text-[#151616]">Age</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.personalInfo.age || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, age: parseInt(e.target.value) || undefined }
                      }))}
                      className="border-2 border-[#151616]"
                      placeholder="Enter age"
                    />
                  ) : (
                    <p className="font-poppins text-[#151616] p-2 bg-[#FFFFF4] rounded-lg">
                      {patientData?.personalInfo.age || 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-poppins text-[#151616]">Gender</Label>
                  {isEditing ? (
                    <select
                      value={editData.personalInfo.gender || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, gender: e.target.value }
                      }))}
                      className="w-full p-2 border-2 border-[#151616] rounded-lg font-poppins"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="font-poppins text-[#151616] p-2 bg-[#FFFFF4] rounded-lg capitalize">
                      {patientData?.personalInfo.gender || 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-poppins text-[#151616]">Location</Label>
                  {isEditing ? (
                    <Input
                      value={editData.personalInfo.location || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      className="border-2 border-[#151616]"
                      placeholder="City, State"
                    />
                  ) : (
                    <p className="font-poppins text-[#151616] p-2 bg-[#FFFFF4] rounded-lg">
                      {patientData?.personalInfo.location || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h3 className="font-poppins font-bold text-[#151616]">Medical History</h3>
              
              {['conditions', 'medications', 'allergies', 'surgeries', 'familyHistory'].map((field) => (
                <div key={field} className="space-y-2">
                  <Label className="font-poppins text-[#151616] capitalize">
                    {field === 'familyHistory' ? 'Family History' : field}
                  </Label>
                  
                  <div className="space-y-2">
                    {editData.medicalHistory[field as keyof typeof editData.medicalHistory].map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="neutral" className="flex-1 justify-start">
                          {item}
                        </Badge>
                        {isEditing && (
                          <Button
                            variant="reverse"
                            size="sm"
                            onClick={() => removeArrayItem(field as keyof typeof editData.medicalHistory, index)}
                            className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {isEditing && (
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Add ${field === 'familyHistory' ? 'family history' : field.slice(0, -1)}`}
                          className="border-2 border-[#151616]"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              addArrayItem(field as keyof typeof editData.medicalHistory, target.value);
                              target.value = '';
                            }
                          }}
                        />
                        <Button
                          variant="reverse"
                          size="sm"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                            if (input) {
                              addArrayItem(field as keyof typeof editData.medicalHistory, input.value);
                              input.value = '';
                            }
                          }}
                          className="border-2 border-[#151616]"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {editData.medicalHistory[field as keyof typeof editData.medicalHistory].length === 0 && !isEditing && (
                      <p className="text-sm font-poppins text-[#151616]/50 italic">None recorded</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-bold text-[#151616]">
                Diagnosis History ({diagnosisHistory.length})
              </h3>
              <Badge variant="neutral" className="text-xs">
                Last 20 sessions
              </Badge>
            </div>

            {diagnosisHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto mb-4 text-[#151616]/30" />
                <p className="font-poppins text-[#151616]/70">No diagnosis history available</p>
                <p className="text-sm font-poppins text-[#151616]/50">
                  Previous diagnoses will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosisHistory.map((session, index) => (
                  <motion.div
                    key={session.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 bg-white rounded-xl border border-[#151616]/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#151616]/60" />
                        <span className="text-sm font-poppins text-[#151616]/70">
                          {new Date(session.createdAt).toLocaleDateString()} at{' '}
                          {new Date(session.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${getStatusColor(session.status)} text-xs`}
                          variant="neutral"
                        >
                          {session.status}
                        </Badge>
                        {session.finalDiagnosis && (
                          <Badge 
                            className={`${getUrgencyColor(session.finalDiagnosis.urgencyLevel)} text-white text-xs`}
                          >
                            {session.finalDiagnosis.urgencyLevel}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {session.finalDiagnosis ? (
                      <div className="space-y-2">
                        <div>
                          <p className="font-poppins font-medium text-[#151616]">
                            {session.finalDiagnosis.primaryDiagnosis.condition}
                          </p>
                          <p className="text-sm font-poppins text-[#151616]/70">
                            Confidence: {session.finalDiagnosis.primaryDiagnosis.confidence}
                          </p>
                        </div>
                        
                        {session.finalDiagnosis.clinicalNotes && (
                          <p className="text-sm font-poppins text-[#151616]/80 bg-[#FFFFF4] p-2 rounded-lg">
                            {session.finalDiagnosis.clinicalNotes.length > 150 
                              ? session.finalDiagnosis.clinicalNotes.substring(0, 150) + '...'
                              : session.finalDiagnosis.clinicalNotes
                            }
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-poppins text-[#151616]/50 italic">
                        Session incomplete or processing
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#151616]/10">
                      <Clock className="w-3 h-3 text-[#151616]/40" />
                      <span className="text-xs font-poppins text-[#151616]/60">
                        Session ID: {session.sessionId.substring(0, 8)}...
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}