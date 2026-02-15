import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import styles from './UsersPage.module.css';

// Roles from BE (for assign)
const ROLES = ['user', 'admin', 'workspace_admin', 'collaborator', 'guest', 'super_admin'];

const initialForm = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'user',
  password: '',
};

export function UsersPage() {
  const { isSuperAdmin, users, fetchUsers, createUser, updateUser, deleteUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State for CRUD/modal/confirm
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Redirect non-super_admin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin, fetchUsers]);

  if (authLoading || !isSuperAdmin) {
    return <div className={styles.page}>Loading or access denied...</div>;
  }

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validateForm = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email required';
    if (!form.firstName.trim()) errors.firstName = 'First name required';
    if (!form.lastName.trim()) errors.lastName = 'Last name required';
    if (!form.role) errors.role = 'Role required';
    if (!editingId && !form.password.trim()) errors.password = 'Password required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = (user = null) => {
    if (user) {
      setForm({ email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, password: '' });
      setEditingId(user.id);
    } else {
      setForm(initialForm);
      setEditingId(null);
    }
    setIsModalOpen(true);
    setFieldErrors({});
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setEditingId(null);
    setFieldErrors({});
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      setError('Fix errors');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const updates = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role,
        };
        if (form.password.trim()) updates.password = form.password;
        await updateUser(editingId, updates);
      } else {
        await createUser({
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role,
          password: form.password,
        });
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRole = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update role');
    }
  };

  const openDeleteConfirm = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setIsConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2>Users Management</h2>
          <p>Super Admin: CRUD users , assign roles (RBAC).</p>
        </div>
        <Button onClick={() => openModal()} className={styles.createBtn}>
          + Create User
        </Button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {/* Table users , assign role dropdown , edit/delete */}
      <div className={styles.list}>
        <h3>Users ({users.length})</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Assign Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.role}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleAssignRole(u.id, e.target.value)}
                    className={styles.roleSelect}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <Button onClick={() => openModal(u)} className={styles.editBtn}>Edit</Button>
                  <Button onClick={() => openDeleteConfirm(u)} className={styles.deleteBtn}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for create/edit user */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit User' : 'Create User'}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange('email')}
              disabled={!!editingId}
              className={fieldErrors.email ? styles.inputError : ''}
            />
            {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
          </div>
          <div className={styles.field}>
            <label>First name</label>
            <input
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange('firstName')}
              className={fieldErrors.firstName ? styles.inputError : ''}
            />
            {fieldErrors.firstName && <span className={styles.fieldError}>{fieldErrors.firstName}</span>}
          </div>
          <div className={styles.field}>
            <label>Last name</label>
            <input
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange('lastName')}
              className={fieldErrors.lastName ? styles.inputError : ''}
            />
            {fieldErrors.lastName && <span className={styles.fieldError}>{fieldErrors.lastName}</span>}
          </div>
          <div className={styles.field}>
            <label>Role</label>
            <select value={form.role} onChange={handleChange('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {!editingId && (
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange('password')}
                className={fieldErrors.password ? styles.inputError : ''}
              />
              {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
            </div>
          )}
          {editingId && (
            <div className={styles.field}>
              <label>New password (leave blank to keep)</label>
              <input
                type="password"
                placeholder="New password"
                value={form.password}
                onChange={handleChange('password')}
              />
            </div>
          )}
          <div className={styles.modalActions}>
            <Button type="submit" disabled={submitting}>Save</Button>
            <Button type="button" onClick={closeModal} variant="secondary">Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Delete ${userToDelete?.email}?`}
      />
    </section>
  );
}