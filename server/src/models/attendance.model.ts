import mongoose, { Document, Schema, Types } from 'mongoose';

export type WorkingStatus = 'in_progress' | 'completed' | 'incomplete';
export type VerificationStatus = 'pending' | 'valid' | 'invalid';
export type OvertimeStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ISelfieMetadata {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ILocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  isWithinGeofence?: boolean;
  distanceFromOfficeMeters?: number;
}

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  attendanceDate: string; // YYYY-MM-DD
  punchInAt: Date;
  punchOutAt?: Date | null;
  punchInSelfie: ISelfieMetadata;
  punchOutSelfie?: ISelfieMetadata | null;
  punchInLocation: ILocationCoords;
  punchOutLocation?: ILocationCoords | null;
  totalWorkingMinutes: number;
  workingStatus: WorkingStatus;
  verificationStatus: VerificationStatus;
  verificationRemarks?: string | null;
  verifiedBy?: Types.ObjectId | null;
  verifiedAt?: Date | null;
  overtimeStatus: OvertimeStatus;
  createdAt: Date;
  updatedAt: Date;
}

const selfieSchema = new Schema<ISelfieMetadata>(
  {
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false }
);

const locationSchema = new Schema<ILocationCoords>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    isWithinGeofence: { type: Boolean, default: true },
    distanceFromOfficeMeters: { type: Number },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attendanceDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    punchInAt: {
      type: Date,
      required: true,
    },
    punchOutAt: {
      type: Date,
      default: null,
    },
    punchInSelfie: {
      type: selfieSchema,
      required: true,
    },
    punchOutSelfie: {
      type: selfieSchema,
      default: null,
    },
    punchInLocation: {
      type: locationSchema,
      required: true,
    },
    punchOutLocation: {
      type: locationSchema,
      default: null,
    },
    totalWorkingMinutes: {
      type: Number,
      default: 0,
    },
    workingStatus: {
      type: String,
      enum: ['in_progress', 'completed', 'incomplete'],
      default: 'in_progress',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending',
      index: true,
    },
    verificationRemarks: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    overtimeStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one attendance record per employee per attendance date
attendanceSchema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
