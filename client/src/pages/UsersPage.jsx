import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Select } from '../components/ui/Select';
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
  const { isSuperAdmin, users, fetchPermissions, createPermission, /* user CRUD via service in auth */ loading: authLoading } = useAuth(); // Extend with user actions from service
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
        // Update user (BE via service)
        // Assign role update
        // (extend if BE supports full patch)
      } else {
        // Create user (signup like)
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRole = async (userId, role) => {
    // Update user role (BE)
    // Super_admin assign
  };

  const openDeleteConfirm = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (userToDelete) {
      // Delete user (BE)
      setIsConfirmOpen(false);
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
                  <Select
                    value={u.role}
                    options={ROLES.map(r => ({ value: r, label: r }))}
                    onChange={(e) => handleAssignRole(u.id, e.target.value)}
                  />
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
          <input type="email" placeholder="Email" value={form.email} onChange={handleChange('email')} required />
          {/* Fields , role select , password */}
          {/* Validation errors */}
          <div className={styles.modalActions}>
            <Button type="submit" disabled={submitting}>Save</Button>
            <Button onClick={closeModal} variant="secondary">Cancel</Button>
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