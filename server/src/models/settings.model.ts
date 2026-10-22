import mongoose, { Document, Schema } from 'mongoose';

export interface IGeofenceSettings extends Document {
  key: string;
  officeName: string;
  officeLat: number;
  officeLng: number;
  radiusMeters: number;
  enforceGeofence: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const geofenceSettingsSchema = new Schema<IGeofenceSettings>(
  {
    key: {
      type: String,
      default: 'default_geofence',
      unique: true,
      index: true,
    },
    officeName: {
      type: String,
      default: 'Main Office Headquarters',
      trim: true,
    },
    officeLat: {
      type: Number,
      required: true,
      default: 37.774929,
    },
    officeLng: {
      type: Number,
      required: true,
      default: -122.419416,
    },
    radiusMeters: {
      type: Number,
      required: true,
      default: 1000,
      min: 50,
      max: 50000,
    },
    enforceGeofence: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const GeofenceSettings = mongoose.model<IGeofenceSettings>('GeofenceSettings', geofenceSettingsSchema);
