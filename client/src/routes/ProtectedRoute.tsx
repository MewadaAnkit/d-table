import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store';
import { useGetMeQuery } from '../services/api';
import { setUser, logout, setLoading } from '../features/auth/authSlice';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, token, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const { data: meData, error: meError, isLoading: isMeLoading } = useGetMeQuery(undefined, {
    skip: !token || !!user,
  });

  useEffect(() => {
    if (meData?.data) {
      dispatch(setUser(meData.data));
    } else if (meError) {
      dispatch(logout());
    } else if (!token) {
      dispatch(setLoading(false));
    }
  }, [meData, meError, token, dispatch]);

  if (isLoading || isMeLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-slate-600">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
