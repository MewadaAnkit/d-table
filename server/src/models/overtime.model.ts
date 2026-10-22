import mongoose, { Document, Schema, Types } from 'mongoose';

export type OvertimeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IOvertimeRequest extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  attendanceId: Types.ObjectId;
  requestedMinutes: number;
  reason: string;
  status: OvertimeRequestStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewRemarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const overtimeSchema = new Schema<IOvertimeRequest>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      index: true,
    },
    requestedMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 720, // max 12 hours overtime request
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewRemarks: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query requests for an employee & attendance
overtimeSchema.index({ employeeId: 1, attendanceId: 1 });

export const OvertimeRequest = mongoose.model<IOvertimeRequest>('OvertimeRequest', overtimeSchema);
