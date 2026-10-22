import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

import {
  useGetUsersQuery,
  useGetManagersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
} from '../../services/api';
import { User, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PaginationControl } from '../../components/common/PaginationControl';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  Search,
  Edit2,
  Power,
  Trash2,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addEmployeeCode, setAddEmployeeCode] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('employee');
  const [addDepartment, setAddDepartment] = useState('Engineering');
  const [addManagerId, setAddManagerId] = useState<string>('');
  const [addIsActive, setAddIsActive] = useState<boolean>(true);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Edit User Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [department, setDepartment] = useState('');
  const [managerId, setManagerId] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const queryParams: any = {
    page,
    limit,
    search: searchTerm || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === '' ? undefined : statusFilter === 'active',
  };

  const { data, isLoading, isFetching } = useGetUsersQuery(queryParams);
  const { data: managersData } = useGetManagersListQuery();
  const managers = managersData?.data || [];

  const [createUserApi, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserApi, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [updateStatusApi] = useUpdateUserStatusMutation();
  const [deleteUserApi, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleOpenAdd = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddEmployeeCode('');
    setAddRole('employee');
    setAddDepartment('Engineering');
    setAddManagerId('');
    setAddIsActive(true);
    setAddError(null);
    setAddSuccess(null);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (addPassword.length < 6) {
      setAddError('Password must be at least 6 characters.');
      return;
    }

    try {
      await createUserApi({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        role: addRole,
        employeeCode: addEmployeeCode.trim().toUpperCase(),
        department: addDepartment.trim() || 'General',
        managerId: addManagerId ? addManagerId : null,
        isActive: addIsActive,
      }).unwrap();

      setAddSuccess('User created successfully!');
      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setAddError(err.data?.message || err.message || 'Failed to create user.');
    }
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setName(user.name);
    setRole(user.role);
    setDepartment(user.department);
    const existingManagerId =
      typeof user.managerId === 'object' ? user.managerId?._id : user.managerId;
    setManagerId(existingManagerId || '');
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError(null);
    setEditSuccess(null);

    try {
      const targetId = selectedUser.id || selectedUser._id!;
      await updateUserApi({
        id: targetId,
        name,
        role,
        department,
        managerId: managerId ? managerId : null,
      }).unwrap();

      setEditSuccess('User details updated successfully!');
      setTimeout(() => {
        setSelectedUser(null);
      }, 1000);
    } catch (err: any) {
      setEditError(err.data?.message || 'Failed to update user.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const targetId = user.id || user._id!;
    const newStatus = !user.isActive;

    if (
      window.confirm(
        `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${user.name}'s account?`
      )
    ) {
      try {
        await updateStatusApi({ id: targetId, isActive: newStatus }).unwrap();
      } catch (err: any) {
        alert(err.data?.message || 'Failed to update account status.');
      }
    }
  };

  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteError(null);
    setDeleteSuccess(null);

    const targetId = userToDelete.id || userToDelete._id!;
    try {
      await deleteUserApi(targetId).unwrap();
      setDeleteSuccess(`User "${userToDelete.name}" was permanently deleted.`);
      setTimeout(() => {
        setUserToDelete(null);
        setDeleteSuccess(null);
      }, 1000);
    } catch (err: any) {
      setDeleteError(err.data?.message || err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              User & Workforce Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Administer corporate user directory, add and delete users, assign direct reporting managers, and control access permissions.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs py-2 px-3.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, code, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 pl-9 pr-2.5 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="employee">Employees</option>
              <option value="manager">Managers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            Total users: <span className="font-semibold text-slate-900 ml-1">{pagination.total}</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading || isFetching ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Users Found"
            description="No user records match your search or filter criteria."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">User Details</th>
                    <th className="px-5 py-3">Employee Code</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Assigned Manager</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const currentId = currentUser?.id || currentUser?._id;
                    const rowId = u.id || u._id;
                    const isSelf = Boolean(currentId && rowId && currentId === rowId);

                    const managerName =
                      typeof u.managerId === 'object' && u.managerId?.name
                        ? `${u.managerId.name} (${u.managerId.employeeCode})`
                        : 'None';

                    return (
                      <tr key={rowId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-50 text-brand-700 rounded border border-brand-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-700 font-medium">
                          {u.employeeCode}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{u.department}</td>
                        <td className="px-5 py-3.5">
                          <Badge status={u.role} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{managerName}</td>
                        <td className="px-5 py-3.5">
                          <Badge status={u.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(u)}
                              className="px-2.5 py-1 text-xs"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={u.isActive ? 'outline' : 'secondary'}
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf && u.isActive}
                              title={
                                isSelf && u.isActive
                                  ? 'You cannot deactivate your own account'
                                  : undefined
                              }
                              className={`px-2.5 py-1 text-xs ${
                                isSelf && u.isActive
                                  ? 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200'
                                  : u.isActive
                                  ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                                  : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDelete(u)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'You cannot delete your own administrative account'
                                  : 'Delete user'
                              }
                              className={`px-2.5 py-1 text-xs ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200'
                                  : 'text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationControl
              pagination={pagination}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            if (!isCreating) setIsAddModalOpen(false);
          }}
          title="Add New User"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            {addError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{addSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. michael@company.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP105"
                  value={addEmployeeCode}
                  onChange={(e) => setAddEmployeeCode(e.target.value.toUpperCase())}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs uppercase font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Access Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as UserRole)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Sales, HR"
                  value={addDepartment}
                  onChange={(e) => setAddDepartment(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assign Direct Reporting Manager (Optional)
              </label>
              <select
                value={addManagerId}
                onChange={(e) => setAddManagerId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="">No Assigned Manager (Reports to Executive)</option>
                {managers.map((m) => (
                  <option key={m.id || m._id} value={m.id || m._id}>
                    {m.name} ({m.employeeCode}) — {m.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="add-is-active"
                type="checkbox"
                checked={addIsActive}
                onChange={(e) => setAddIsActive(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <label htmlFor="add-is-active" className="text-xs text-slate-700 cursor-pointer">
                Activate account immediately upon creation
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                disabled={isCreating}
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isCreating}>
                Create User
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Edit User: ${selectedUser.name}`}
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            {editError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Access Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assign Direct Reporting Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="">No Assigned Manager (Reports to Executive)</option>
                {managers
                  .filter((m) => (m.id || m._id) !== (selectedUser.id || selectedUser._id))
                  .map((m) => (
                    <option key={m.id || m._id} value={m.id || m._id}>
                      {m.name} ({m.employeeCode}) — {m.role}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={!!userToDelete}
          onClose={() => {
            if (!isDeleting) {
              setUserToDelete(null);
              setDeleteError(null);
            }
          }}
          title="Confirm User Deletion"
          maxWidth="md"
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {deleteSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{deleteSuccess}</span>
              </div>
            )}

            <div className="flex items-start gap-3.5 bg-rose-50/70 border border-rose-100 rounded-xl p-4">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <p className="font-semibold text-slate-900 text-sm">
                  Are you sure you want to delete this user?
                </p>
                <p className="text-slate-600 leading-relaxed">
                  You are about to delete user <strong className="text-slate-900">{userToDelete.name}</strong> (Code: <span className="font-mono font-medium text-slate-800">{userToDelete.employeeCode}</span>, Email: {userToDelete.email}).
                </p>
                <p className="text-rose-700 font-medium pt-1">
                  ⚠️ This action cannot be undone. All attendance sessions, overtime logs, and user records will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteError(null);
                }}
              >
                No, Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Yes, Delete User
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
