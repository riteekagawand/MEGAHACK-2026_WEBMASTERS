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
    const search = searchParams.get('search') || '';

    // Aggregate to get unique patients with their latest diagnosis
    // Filter by clinicianId so doctors only see their own patients
    const matchStage: any = {
      clinicianId: session.user.email
    };
    if (search) {
      matchStage.patientName = { $regex: new RegExp(search.trim(), 'i') };
    }

    const patients = await DiagnosisHistory.aggregate([
      { $match: matchStage },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$patientName',
          patientName: { $first: '$patientName' },
          patientAge: { $first: '$patientAge' },
          patientGender: { $first: '$patientGender' },
          medicalHistory: { $first: '$medicalHistory' },
          lastVisit: { $first: '$createdAt' },
          totalVisits: { $sum: 1 },
          latestDiagnosis: { $first: '$finalDiagnosis.condition' },
          latestUrgency: { $first: '$finalDiagnosis.urgencyLevel' },
          latestConfidence: { $first: '$finalDiagnosis.confidence' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$patientName',
          age: '$patientAge',
          gender: '$patientGender',
          medicalHistory: '$medicalHistory',
          lastVisit: '$lastVisit',
          totalVisits: '$totalVisits',
          latestDiagnosis: '$latestDiagnosis',
          latestUrgency: '$latestUrgency',
          latestConfidence: '$latestConfidence'
        }
      },
      {
        $sort: { lastVisit: -1 }
      }
    ]);

    return NextResponse.json({
      patients,
      total: patients.length
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
