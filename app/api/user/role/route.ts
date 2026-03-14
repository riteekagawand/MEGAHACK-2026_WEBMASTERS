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
    const { role } = body;

    if (!role || !['clinician', 'patient'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "clinician" or "patient"' },
        { status: 400 }
      );
    }

    // Find existing user or create new one
    let patient = await Patient.findOne({ userId: session.user.email });
    
    const updateData = {
      userId: session.user.email,
      role: role,
      personalInfo: {
        name: session.user.name || '',
        email: session.user.email,
      }
    };

    if (patient) {
      // Update existing patient
      patient = await Patient.findOneAndUpdate(
        { userId: session.user.email },
        { $set: updateData },
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
      message: 'User role saved successfully',
      role: role
    });

  } catch (error) {
    console.error('Error saving user role:', error);
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
      role: patient?.role || null
    });

  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
