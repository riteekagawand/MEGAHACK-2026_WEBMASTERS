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

    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patientName');

    if (!patientName) {
      return NextResponse.json(
        { error: 'Patient name is required' },
        { status: 400 }
      );
    }

    // Search for patient history by name (case-insensitive)
    const patientHistory = await DiagnosisHistory.find({
      patientName: { $regex: new RegExp(patientName.trim(), 'i') }
    })
    .sort({ createdAt: -1 })
    .limit(10) // Limit to last 10 diagnoses
    .lean();

    if (patientHistory.length === 0) {
      return NextResponse.json({
        message: 'No previous history found for this patient',
        isFirstTime: true,
        history: []
      });
    }

    // Get the most recent patient info for prefilling
    const mostRecent = patientHistory[0];
    
    // Format history data
    const formattedHistory = patientHistory.map(record => ({
      id: record._id,
      date: record.createdAt,
      symptoms: record.symptoms,
      diagnosis: record.finalDiagnosis.condition,
      confidence: record.finalDiagnosis.confidence,
      urgencyLevel: record.finalDiagnosis.urgencyLevel,
      medicalHistory: record.medicalHistory
    }));

    // Generate summary for context
    const diagnosisFrequency = patientHistory.reduce((acc: any, record) => {
      const condition = record.finalDiagnosis.condition;
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});

    const commonConditions = Object.entries(diagnosisFrequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([condition, count]) => ({ condition, count }));

    return NextResponse.json({
      message: 'Patient history found',
      isFirstTime: false,
      patientInfo: {
        name: mostRecent.patientName,
        age: mostRecent.patientAge,
        gender: mostRecent.patientGender,
        medicalHistory: mostRecent.medicalHistory
      },
      history: formattedHistory,
      summary: {
        totalVisits: patientHistory.length,
        commonConditions,
        lastVisit: mostRecent.createdAt,
        recentTrends: formattedHistory.slice(0, 3).map(h => h.diagnosis)
      },
      contextForAI: {
        previousDiagnoses: formattedHistory.slice(0, 5),
        medicalHistory: mostRecent.medicalHistory,
        patientProfile: {
          age: mostRecent.patientAge,
          gender: mostRecent.patientGender,
          riskFactors: commonConditions.map(c => c.condition)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
