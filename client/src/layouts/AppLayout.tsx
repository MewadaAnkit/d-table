import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { useLogoutUserMutation, api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { NotificationDropdown } from '../components/common/NotificationDropdown';
import { connectSocket, disconnectSocket } from '../services/socket';
import {
  LayoutDashboard,
  CalendarCheck,
  Camera,
  Clock,
  FileText,
  User as UserIcon,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Briefcase,
  Wifi,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [logoutApi] = useLogoutUserMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Real-time Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user, token);

    const handleAttendanceChange = (payload: any) => {
      dispatch(api.util.invalidateTags(['Attendance', 'ActiveSession', 'Dashboard', 'Reports']));
      if (user.role === 'manager' || user.role === 'admin') {
        const name = payload.employeeName || 'An employee';
        const type = payload.type === 'punch_in' ? 'punched in' : 'punched out';
        setLiveToast(`⚡ Live Update: ${name} ${type}`);
        setTimeout(() => setLiveToast(null), 4000);
      }
    };

    const handleOvertimeChange = (payload: any) => {
      dispatch(api.util.invalidateTags(['Overtime', 'Dashboard', 'Notifications']));
      if (payload.status) {
        setLiveToast(`📋 Overtime request marked as ${payload.status}`);
        setTimeout(() => setLiveToast(null), 4000);
      }
    };

    const handleNotificationNew = (payload: any) => {
      dispatch(api.util.invalidateTags(['Notifications']));
      setLiveToast(`🔔 ${payload.title}: ${payload.message}`);
      setTimeout(() => setLiveToast(null), 5000);
    };

    socket.on('attendance:new', handleAttendanceChange);
    socket.on('attendance:update', handleAttendanceChange);
    socket.on('attendance:verified', handleAttendanceChange);
    socket.on('overtime:new', handleOvertimeChange);
    socket.on('overtime:updated', handleOvertimeChange);
    socket.on('overtime:status_changed', handleOvertimeChange);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('attendance:new', handleAttendanceChange);
      socket.off('attendance:update', handleAttendanceChange);
      socket.off('attendance:verified', handleAttendanceChange);
      socket.off('overtime:new', handleOvertimeChange);
      socket.off('overtime:updated', handleOvertimeChange);
      socket.off('overtime:status_changed', handleOvertimeChange);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [user, token, dispatch]);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Continue client logout even if server fails
    }
    disconnectSocket();
    dispatch(api.util.resetApiState());
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'admin') {
      return [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'User Management', path: '/admin/users', icon: Users },
        { label: 'All Attendance', path: '/admin/attendance', icon: CalendarCheck },
        { label: 'Attendance Verification', path: '/admin/verification', icon: ShieldCheck },
        { label: 'Overtime Management', path: '/admin/overtime', icon: Clock },
        { label: 'Attendance Reports', path: '/admin/reports', icon: FileText },
        { label: 'Punch In / Out', path: '/punch', icon: Camera },
      ];
    }

    if (user.role === 'manager') {
      return [
        { label: 'Team Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { label: 'Team Attendance', path: '/manager/attendance', icon: CalendarCheck },
        { label: 'Attendance Verification', path: '/manager/verification', icon: ShieldCheck },
        { label: 'Overtime Approvals', path: '/manager/overtime', icon: Clock },
        { label: 'Team Reports', path: '/manager/reports', icon: FileText },
        { label: 'Punch In / Out', path: '/punch', icon: Camera },
        { label: 'My Attendance', path: '/attendance', icon: CalendarCheck },
        { label: 'My Profile', path: '/profile', icon: UserIcon },
      ];
    }

    // Employee
    return [
      { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Punch In / Out', path: '/punch', icon: Camera },
      { label: 'My Attendance', path: '/attendance', icon: CalendarCheck },
      { label: 'Overtime Requests', path: '/overtime', icon: Clock },
      { label: 'My Reports', path: '/reports', icon: FileText },
      { label: 'My Profile', path: '/profile', icon: UserIcon },
    ];
  };

  const links = getNavLinks();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
      {/* Real-time Floating Notification Toast */}
      {liveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 shadow-2xl border border-slate-700 backdrop-blur text-xs animate-in fade-in slide-in-from-top-3">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
          <span className="font-medium">{liveToast}</span>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Attendly</span>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-400 px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-900">
                SaaS
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {user?.role === 'admin' ? 'Administration' : user?.role === 'manager' ? 'Management' : 'Self Service'}
          </div>
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold border-l-4 border-brand-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user?.employeeCode || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 transition-colors">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-900 dark:text-white">
                {user?.department || 'Attendly'}
              </span>
              <span>/</span>
              <span className="capitalize">{user?.role} Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Real-time Socket status pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </div>

            {/* In-App Notifications Center */}
            <NotificationDropdown />

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Role Badge */}
            <Badge status={user?.role || 'employee'} />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              Sign out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
