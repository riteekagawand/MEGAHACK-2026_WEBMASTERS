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
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get all diagnoses for this doctor in the period
    const diagnoses = await DiagnosisHistory.find({
      clinicianId: session.user.email,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).lean();

    // Calculate metrics
    const totalDiagnoses = diagnoses.length;
    const uniquePatients = new Set(diagnoses.map(d => d.patientName)).size;
    
    const avgConfidence = totalDiagnoses > 0 
      ? Math.round(diagnoses.reduce((sum, d) => sum + d.finalDiagnosis.confidence, 0) / totalDiagnoses)
      : 0;

    // Urgency distribution
    const urgencyDistribution = diagnoses.reduce((acc, d) => {
      const level = d.finalDiagnosis.urgencyLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top conditions
    const conditionCounts = diagnoses.reduce((acc, d) => {
      const condition = d.finalDiagnosis.condition;
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topConditions = (Object.entries(conditionCounts) as Array<[string, number]>)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Gender distribution
    const genderDistribution = diagnoses.reduce((acc, d) => {
      const gender = d.patientGender;
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Age distribution
    const ageDistribution = diagnoses.reduce((acc, d) => {
      const age = parseInt(d.patientAge);
      if (age < 18) acc['0-17'] = (acc['0-17'] || 0) + 1;
      else if (age < 30) acc['18-29'] = (acc['18-29'] || 0) + 1;
      else if (age < 50) acc['30-49'] = (acc['30-49'] || 0) + 1;
      else if (age < 65) acc['50-64'] = (acc['50-64'] || 0) + 1;
      else acc['65+'] = (acc['65+'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Diagnoses over time (last 30 days)
    const diagnosesByDate = diagnoses.reduce((acc, d) => {
      const date = new Date(d.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fill in missing dates
    const trendData = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendData.push({
        date: dateStr,
        count: diagnosesByDate[dateStr] || 0
      });
    }

    // Recent activity (last 5 diagnoses)
    const recentActivity = diagnoses.slice(0, 5).map(d => ({
      patientName: d.patientName,
      diagnosis: d.finalDiagnosis.condition,
      urgency: d.finalDiagnosis.urgencyLevel,
      confidence: d.finalDiagnosis.confidence,
      date: d.createdAt
    }));

    return NextResponse.json({
      overview: {
        totalDiagnoses,
        uniquePatients,
        avgConfidence
      },
      urgencyDistribution,
      topConditions,
      genderDistribution,
      ageDistribution,
      trendData,
      recentActivity
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
