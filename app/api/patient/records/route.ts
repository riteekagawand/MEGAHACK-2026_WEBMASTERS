import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DiagnosisHistory from '@/lib/models/DiagnosisHistory';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all diagnoses where patient email matches the logged-in user
    const userEmail = session.user.email;

    // Search for records where patientEmail matches user's email
    // Also include records where patientName contains the email (for backward compatibility)
    const userName = userEmail.split('@')[0];
    const records = await DiagnosisHistory.find({
      $or: [
        { patientEmail: userEmail },
        { patientName: { $regex: new RegExp(userName, 'i') } },
        { clinicianId: userEmail }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    // Format records for display
    const formattedRecords = records.map(record => ({
      id: record._id.toString(),
      date: record.createdAt,
      patientName: record.patientName,
      age: record.patientAge,
      gender: record.patientGender,
      symptoms: record.symptoms,
      medicalHistory: record.medicalHistory,
      diagnosis: record.finalDiagnosis?.condition || 'Unknown',
      confidence: record.finalDiagnosis?.confidence || 0,
      urgencyLevel: record.finalDiagnosis?.urgencyLevel || 'Unknown',
      doctorEmail: record.clinicianId,
      aiResults: {
        analytica: record.diagnosisResults?.analytica,
        researchBot: record.diagnosisResults?.researchBot,
        coordinator: record.diagnosisResults?.coordinator
      }
    }));

    return NextResponse.json({
      records: formattedRecords,
      total: formattedRecords.length
    });

  } catch (error) {
    console.error('Error fetching patient records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
