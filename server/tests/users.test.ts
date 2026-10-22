import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';

describe('Admin User Management (Add & Delete Users)', () => {
  let adminToken: string;
  let adminId: string;
  let employeeToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    await connectDB();

    // Login as Admin
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@attendly.local',
      password: 'Password123!',
    });
    adminToken = adminLoginRes.body.data.token;
    adminId = adminLoginRes.body.data.user.id;

    // Login as Employee
    const empLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'alex@attendly.local',
      password: 'Password123!',
    });

    employeeToken = empLoginRes.body.data.token;
  });

  afterAll(async () => {
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }
    await disconnectDB();
  });

  it('should prevent non-admin from creating a user', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Unauthorized User',
        email: `unauth_${Date.now()}@attendly.local`,
        password: 'Password123!',
        employeeCode: `NOAUTH${Date.now().toString().slice(-4)}`,
        role: 'employee',
        department: 'Operations',
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to create a new user successfully', async () => {
    const uniqueEmail = `newuser_${Date.now()}@attendly.local`;
    const uniqueCode = `EMP${Date.now().toString().slice(-4)}`;

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Test Employee',
        email: uniqueEmail,
        password: 'Password123!',
        role: 'employee',
        employeeCode: uniqueCode,
        department: 'Engineering',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New Test Employee');
    expect(res.body.data.email).toBe(uniqueEmail);
    expect(res.body.data.employeeCode).toBe(uniqueCode);
    expect(res.body.data.passwordHash).toBeUndefined(); // Never leak passwordHash

    createdUserId = res.body.data._id;
  });

  it('should reject creating a user with duplicate email or employee code', async () => {
    const existing = await User.findById(createdUserId);
    expect(existing).not.toBeNull();

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Employee',
        email: existing!.email,
        password: 'Password123!',
        role: 'employee',
        employeeCode: `DIFF${Date.now().toString().slice(-4)}`,
        department: 'Engineering',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject admin deleting their own account', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cannot delete your own administrative account');
  });

  it('should prevent non-admin from deleting any user', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to delete the user and verify removal from database', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('permanently deleted');

    // Confirm user is deleted from MongoDB
    const checkDeleted = await User.findById(createdUserId);
    expect(checkDeleted).toBeNull();
  });
});
