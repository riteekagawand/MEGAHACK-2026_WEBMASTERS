import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, invalidateRoleCache } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Patient from '@/lib/models/Patient';

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
      age,
      gender,
      location,
      height,
      weight,
      bloodGroup,
      occupation,
      medicalConditions,
      medications,
      allergies,
      familyHistory,
      surgeries
    } = body;

    // Find existing patient or create new one
    let patient = await Patient.findOne({ userId: session.user.email });
    
    const updateData = {
      userId: session.user.email,
      personalInfo: {
        name: session.user.name || '',
        email: session.user.email,
        age: parseInt(age),
        gender,
        location,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        bloodGroup,
        occupation
      },
      medicalHistory: {
        conditions: medicalConditions || [],
        medications: medications || [],
        allergies: allergies || [],
        surgeries: surgeries || [],
        familyHistory: familyHistory || []
      }
    };

    if (patient) {
      // Update existing patient
      patient = await Patient.findOneAndUpdate(
        { userId: session.user.email },
        updateData,
        { new: true, upsert: true }
      );
    } else {
      // Create new patient
      patient = new Patient(updateData);
      await patient.save();
    }

    // Invalidate cache for this user
    invalidateRoleCache(session.user.email);

    return NextResponse.json({
      message: 'User information saved successfully'
    });

  } catch (error) {
    console.error('Error saving user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const patient = await Patient.findOne({ userId: session.user.email });
    
    return NextResponse.json({
      role: patient?.role || null,
      personalInfo: patient?.personalInfo || {},
      medicalHistory: patient?.medicalHistory || {}
    });

  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}