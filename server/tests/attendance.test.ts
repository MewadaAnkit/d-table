import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { getAttendanceDateString } from '../src/utils/date.utils.js';

const VALID_SAMPLE_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAK8AAACvABQqw0mAAAAB50RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAA1SURBVHic7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAODVABXAAAFp1T2bAAAAAElFTkSuQmCC';

describe('Attendance API & Business Rules', () => {
  let employeeToken: string;
  let employeeId: string;
  let managerToken: string;
  let managerId: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectDB();

    // Clean up test employee attendance for today
    const alex = await User.findOne({ email: 'alex@attendly.local' });
    const manager = await User.findOne({ email: 'manager@attendly.local' });
    const admin = await User.findOne({ email: 'admin@attendly.local' });

    if (alex) {
      employeeId = alex._id.toString();
      await Attendance.deleteMany({ employeeId: alex._id, attendanceDate: getAttendanceDateString() });
    }
    if (manager) managerId = manager._id.toString();

    // Login users to get tokens
    const empLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'alex@attendly.local',
      password: 'Password123!',
    });
    employeeToken = empLogin.body.data.token;

    const mgrLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'manager@attendly.local',
      password: 'Password123!',
    });
    managerToken = mgrLogin.body.data.token;

    const admLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@attendly.local',
      password: 'Password123!',
    });
    adminToken = admLogin.body.data.token;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should reject punch-in without valid camera image payload', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/punch-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        selfie: 'not-an-image',
        location: { latitude: 37.77, longitude: -122.41 },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully punch in with live selfie & location', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/punch-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        selfie: VALID_SAMPLE_IMAGE,
        location: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workingStatus).toBe('in_progress');
    expect(res.body.data.verificationStatus).toBe('pending');
    expect(res.body.data.punchInAt).toBeDefined();
    expect(res.body.data.punchOutAt).toBeNull();
  });

  it('should prevent duplicate punch-in when already punched in today', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/punch-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        selfie: VALID_SAMPLE_IMAGE,
        location: { latitude: 37.7749, longitude: -122.4194 },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('active attendance session in progress');
  });

  it('should successfully punch out and calculate working duration on server', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/punch-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        selfie: VALID_SAMPLE_IMAGE,
        location: { latitude: 37.7749, longitude: -122.4194 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.punchOutAt).toBeDefined();
    // Since punch-in and punch-out occurred in seconds, working duration < 480m => incomplete
    expect(res.body.data.workingStatus).toBe('incomplete');
    expect(res.body.data.punchOutSelfie.storageKey).toBeDefined();
  });

  it('should prevent employee from accessing manager team queue', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/team')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow manager to access team attendance queue', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/team')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.records)).toBe(true);
  });

  it('should require a reason when marking attendance invalid', async () => {
    // Find an attendance record to verify
    const record = await Attendance.findOne({ employeeId });

    const res = await request(app)
      .patch(`/api/v1/attendance/${record?._id}/verification`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        verificationStatus: 'invalid',
        // remarks omitted
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully mark attendance valid with remarks', async () => {
    const record = await Attendance.findOne({ employeeId });

    const res = await request(app)
      .patch(`/api/v1/attendance/${record?._id}/verification`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        verificationStatus: 'valid',
        remarks: 'Confirmed via office security log',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('valid');
    expect(res.body.data.verificationRemarks).toBe('Confirmed via office security log');
  });
});
