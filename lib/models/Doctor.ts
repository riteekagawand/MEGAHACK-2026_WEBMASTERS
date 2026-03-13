import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  userId: string;
  name: string;
  email: string;
  specialization: string;
  yearsOfExperience: number;
  consultationFee: number;
  description: string;
  availability: {
    day: string;
    slots: string[];
  }[];
  bookedSlots: {
    date: string;
    time: string;
    patientId: string;
  }[];
  rating: number;
  totalConsultations: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    availability: [
      {
        day: {
          type: String,
          required: true,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
        slots: [String],
      },
    ],
    bookedSlots: [
      {
        date: {
          type: String,
          required: true,
        },
        time: {
          type: String,
          required: true,
        },
        patientId: {
          type: String,
          required: true,
        },
      },
    ],
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

DoctorSchema.methods.isSlotAvailable = function(date: string, time: string): boolean {
  return !this.bookedSlots.some(
    (slot: any) => slot.date === date && slot.time === time
  );
};

DoctorSchema.methods.bookSlot = function(date: string, time: string, patientId: string) {
  if (!this.isSlotAvailable(date, time)) {
    throw new Error('Slot is already booked');
  }
  
  this.bookedSlots.push({ date, time, patientId });
  return this.save();
};

export default mongoose.models.Doctor ||
  mongoose.model<IDoctor>("Doctor", DoctorSchema);
