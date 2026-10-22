import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';

describe('Auth API & Security', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@attendly.local',
      password: 'Password123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@attendly.local',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('should successfully log in valid admin and return JWT & user details', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@attendly.local',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.email).toBe('admin@attendly.local');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never leak passwordHash
  });

  it('should allow employee signup and enforce role = employee even if client passes admin', async () => {
    const uniqueCode = `EMP-TEST-${Date.now()}`;
    const uniqueEmail = `testuser_${Date.now()}@attendly.local`;

    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Test Signup Employee',
      email: uniqueEmail,
      password: 'Password123!',
      employeeCode: uniqueCode,
      department: 'QA',
      role: 'admin', // Attempted privilege escalation
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('employee'); // Must remain employee!

    // Verify in database
    const userInDb = await User.findOne({ email: uniqueEmail });
    expect(userInDb).toBeDefined();
    expect(userInDb?.role).toBe('employee');
  });

  it('should prevent duplicate signup with same email', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Duplicate Admin',
      email: 'admin@attendly.local',
      password: 'Password123!',
      employeeCode: 'EMP-DUP-1',
      department: 'QA',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });
});
