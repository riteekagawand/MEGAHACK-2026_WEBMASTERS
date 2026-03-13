import mongoose, { Schema, Document } from "mongoose";

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  consultationFee: number;
  originalFee?: number;
  discountAmount?: number;
  coinsUsed?: number;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  paymentId?: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  notes?: string;
  prescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    originalFee: {
      type: Number,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    paymentId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    prescription: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ date: 1, time: 1, doctorId: 1 });

export default mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
