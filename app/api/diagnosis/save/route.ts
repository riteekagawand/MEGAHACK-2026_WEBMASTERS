import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DiagnosisHistory from '@/lib/models/DiagnosisHistory';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      patientName,
      patientAge,
      patientGender,
      medicalHistory,
      symptoms,
      diagnosisResults,
      finalDiagnosis
    } = body;

    // Validate required fields
    if (!patientName || !patientAge || !patientGender || !symptoms || !finalDiagnosis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine if the logged-in user is the patient or the doctor
    // If patientName matches the user's email name, they're the patient
    const userEmail = session.user.email;
    const userName = userEmail.split('@')[0].toLowerCase();
    const isPatient = patientName.toLowerCase().includes(userName) || 
                      userName.includes(patientName.toLowerCase());
    
    // Create new diagnosis history record
    const diagnosisHistory = new DiagnosisHistory({
      patientName: patientName.trim(),
      patientAge,
      patientGender,
      patientEmail: isPatient ? userEmail : null, // Store patient email only if user is the patient
      medicalHistory: medicalHistory || '',
      symptoms,
      diagnosisResults: {
        analytica: diagnosisResults?.analytica || null,
        researchBot: diagnosisResults?.researchBot || null,
        epiWatch: diagnosisResults?.epiWatch || null,
        patternSeeker: diagnosisResults?.patternSeeker || null,
        riskAnalyzer: diagnosisResults?.riskAnalyzer || null,
        coordinator: diagnosisResults?.coordinator || null
      },
      finalDiagnosis: {
        condition: finalDiagnosis.condition,
        confidence: finalDiagnosis.confidence,
        urgencyLevel: finalDiagnosis.urgencyLevel
      },
      clinicianId: session.user.email
    });

    await diagnosisHistory.save();

    return NextResponse.json({
      message: 'Diagnosis history saved successfully',
      diagnosisId: diagnosisHistory._id
    });

  } catch (error) {
    console.error('Error saving diagnosis history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
