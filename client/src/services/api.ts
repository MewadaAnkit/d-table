import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../app/store';
import { User, AttendanceRecord, OvertimeRecord, Pagination } from '../types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('attendly_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Attendance', 'ActiveSession', 'Overtime', 'Dashboard', 'Reports', 'Notifications'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<{ success: boolean; data: { token: string; user: User } }, any>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Dashboard', 'ActiveSession'],
    }),
    signup: builder.mutation<{ success: boolean; data: { token: string; user: User } }, any>({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    logoutUser: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query<{ success: boolean; data: User }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Attendance endpoints
    punchIn: builder.mutation<{ success: boolean; message: string; data: AttendanceRecord }, { selfie: string; location: { latitude: number; longitude: number; accuracy?: number } }>({
      query: (payload) => ({
        url: '/attendance/punch-in',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Attendance', 'ActiveSession', 'Dashboard', 'Reports'],
    }),
    punchOut: builder.mutation<{ success: boolean; message: string; data: AttendanceRecord }, { selfie: string; location: { latitude: number; longitude: number; accuracy?: number } }>({
      query: (payload) => ({
        url: '/attendance/punch-out',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Attendance', 'ActiveSession', 'Dashboard', 'Reports'],
    }),
    getActiveSession: builder.query<{ success: boolean; data: AttendanceRecord | null }, void>({
      query: () => '/attendance/active',
      providesTags: ['ActiveSession'],
    }),
    getMyAttendance: builder.query<{ success: boolean; data: { records: AttendanceRecord[]; pagination: Pagination } }, { page?: number; limit?: number; date?: string; startDate?: string; endDate?: string; workingStatus?: string; verificationStatus?: string }>({
      query: (params) => ({
        url: '/attendance/me',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getTeamAttendance: builder.query<{ success: boolean; data: { records: AttendanceRecord[]; pagination: Pagination } }, { page?: number; limit?: number; date?: string; startDate?: string; endDate?: string; employeeId?: string; workingStatus?: string; verificationStatus?: string }>({
      query: (params) => ({
        url: '/attendance/team',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAllAttendance: builder.query<{ success: boolean; data: { records: AttendanceRecord[]; pagination: Pagination } }, { page?: number; limit?: number; date?: string; startDate?: string; endDate?: string; employeeId?: string; workingStatus?: string; verificationStatus?: string }>({
      query: (params) => ({
        url: '/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceById: builder.query<{ success: boolean; data: AttendanceRecord }, string>({
      query: (id) => `/attendance/${id}`,
      providesTags: ['Attendance'],
    }),
    verifyAttendance: builder.mutation<{ success: boolean; message: string; data: AttendanceRecord }, { id: string; verificationStatus: 'valid' | 'invalid'; remarks?: string }>({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}/verification`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Attendance', 'Dashboard', 'Reports'],
    }),

    // Overtime endpoints
    createOvertimeRequest: builder.mutation<{ success: boolean; message: string; data: OvertimeRecord }, { attendanceId: string; requestedMinutes: number; reason: string }>({
      query: (body) => ({
        url: '/overtime',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Overtime', 'Attendance', 'Dashboard'],
    }),
    getMyOvertimeRequests: builder.query<{ success: boolean; data: { requests: OvertimeRecord[]; pagination: Pagination } }, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/overtime/me',
        params,
      }),
      providesTags: ['Overtime'],
    }),
    getOvertimeRequests: builder.query<{ success: boolean; data: { requests: OvertimeRecord[]; pagination: Pagination } }, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/overtime',
        params,
      }),
      providesTags: ['Overtime'],
    }),
    reviewOvertimeRequest: builder.mutation<{ success: boolean; message: string; data: OvertimeRecord }, { id: string; status: 'approved' | 'rejected'; reviewRemarks?: string }>({
      query: ({ id, ...body }) => ({
        url: `/overtime/${id}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Overtime', 'Attendance', 'Dashboard', 'Reports'],
    }),

    // Reports endpoints
    getDailyReports: builder.query<{ success: boolean; data: { records: AttendanceRecord[]; pagination: Pagination } }, { page?: number; limit?: number; date?: string; startDate?: string; endDate?: string; employeeId?: string; department?: string; workingStatus?: string; verificationStatus?: string }>({
      query: (params) => ({
        url: '/reports/daily',
        params,
      }),
      providesTags: ['Reports'],
    }),

    // Admin Users endpoints
    getUsers: builder.query<{ success: boolean; data: { users: User[]; pagination: Pagination } }, { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean | string; department?: string }>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getManagersList: builder.query<{ success: boolean; data: User[] }, void>({
      query: () => '/users/managers',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation<{ success: boolean; message: string; data: User }, { id: string; name?: string; role?: string; department?: string; managerId?: string | null }>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUserStatus: builder.mutation<{ success: boolean; message: string; data: { id: string; isActive: boolean } }, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['User'],
    }),
    createUser: builder.mutation<
      { success: boolean; message: string; data: User },
      {
        name: string;
        email: string;
        password: string;
        role: string;
        employeeCode: string;
        department: string;
        managerId?: string | null;
        isActive?: boolean;
      }
    >({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),
    deleteUser: builder.mutation<{ success: boolean; message: string; data: { id: string } }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Dashboard', 'Attendance', 'Overtime', 'Reports'],
    }),


    // Dashboard aggregations
    getEmployeeDashboard: builder.query<any, void>({
      query: () => '/dashboard/employee',
      providesTags: ['Dashboard'],
    }),
    getManagerDashboard: builder.query<any, { date?: string }>({
      query: (params) => ({
        url: '/dashboard/manager',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getAdminDashboard: builder.query<any, { date?: string }>({
      query: (params) => ({
        url: '/dashboard/admin',
        params,
      }),
      providesTags: ['Dashboard'],
    }),

    // Bonus Features: Geofence config & Notifications
    getGeofenceConfig: builder.query<{ success: boolean; data: { officeLat: number; officeLng: number; radiusMeters: number; enforceGeofence: boolean } }, void>({
      query: () => '/attendance/geofence-config',
    }),
    getNotifications: builder.query<{ success: boolean; data: { notifications: Array<{ _id: string; title: string; message: string; type: string; isRead: boolean; link?: string; createdAt: string }>; unreadCount: number } }, void>({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutUserMutation,
  useGetMeQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetActiveSessionQuery,
  useGetGeofenceConfigQuery,
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useGetAttendanceByIdQuery,
  useVerifyAttendanceMutation,
  useCreateOvertimeRequestMutation,
  useGetMyOvertimeRequestsQuery,
  useGetOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
  useGetDailyReportsQuery,
  useLazyGetDailyReportsQuery,
  useGetUsersQuery,
  useGetManagersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetEmployeeDashboardQuery,
  useGetManagerDashboardQuery,
  useGetAdminDashboardQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = api;
