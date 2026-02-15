import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import styles from './RolesPage.module.css';

const initialForm = {
  id: '',
  name: '',
  description: '',
  permissions: [],
};

export function RolesPage() {
  const {
    isSuperAdmin,
    roles,
    permissions,
    fetchRoles,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRoles();
      fetchPermissions();
    }
  }, [isSuperAdmin, fetchRoles, fetchPermissions]);

  if (authLoading || !isSuperAdmin) {
    return <div className={styles.page}>Loading or access denied...</div>;
  }

  const validateForm = () => {
    const errors = {};
    if (!form.id.trim() && !editingId) errors.id = 'Role ID is required (e.g. custom_role)';
    if (form.id.trim() && !/^[a-z0-9_]+$/i.test(form.id.trim())) errors.id = 'ID can only contain letters, numbers, underscore';
    if (!editingId && roles.some((r) => r.id.toLowerCase() === form.id.trim().toLowerCase())) errors.id = 'ID already exists';
    if (!form.name.trim()) errors.name = 'Name is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = (role = null) => {
    if (role) {
      setForm({
        id: role.id,
        name: role.name || '',
        description: role.description || '',
        permissions: Array.isArray(role.permissions) ? role.permissions.map((p) => (typeof p === 'string' ? p : p.id)) : [],
      });
      setEditingId(role.id);
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

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const togglePermission = (permId) => {
    const current = form.permissions || [];
    const next = current.includes(permId) ? current.filter((id) => id !== permId) : [...current, permId];
    setForm((prev) => ({ ...prev, permissions: next }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: form.permissions || [],
      };
      if (editingId) {
        await updateRole(editingId, payload);
      } else {
        await createRole({ ...payload, id: form.id.trim() });
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (role) => {
    setRoleToDelete(role);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id);
      setIsConfirmOpen(false);
      setRoleToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2>Roles Management</h2>
          <p>Super Admin only: CRUD roles and assign permissions (RBAC).</p>
        </div>
        <Button onClick={() => openModal()} className={styles.createBtn}>
          + Create Role
        </Button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        <h3>Roles ({roles.length})</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td><code>{r.id}</code></td>
                <td>{r.name}</td>
                <td>{r.description || '—'}</td>
                <td>
                  <span className={styles.permCount}>
                    {Array.isArray(r.permissions) ? r.permissions.length : 0} permissions
                  </span>
                </td>
                <td>
                  <button type="button" onClick={() => openModal(r)} className={styles.editBtn}>Edit</button>
                  <button type="button" onClick={() => openDeleteConfirm(r)} className={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Role' : 'Create Role'}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label>Role ID</label>
            <input
              type="text"
              placeholder="e.g. custom_role"
              value={form.id}
              onChange={handleChange('id')}
              disabled={!!editingId}
              className={fieldErrors.id ? styles.inputError : ''}
            />
            {fieldErrors.id && <span className={styles.fieldError}>{fieldErrors.id}</span>}
          </div>
          <div className={styles.field}>
            <label>Name</label>
            <input
              placeholder="Display name"
              value={form.name}
              onChange={handleChange('name')}
              className={fieldErrors.name ? styles.inputError : ''}
            />
            {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <input
              placeholder="Optional description"
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>
          <div className={styles.field}>
            <label>Permissions</label>
            <div className={styles.permList}>
              {permissions.map((p) => (
                <label key={p.id} className={styles.permCheck}>
                  <input
                    type="checkbox"
                    checked={(form.permissions || []).includes(p.id)}
                    onChange={() => togglePermission(p.id)}
                  />
                  <span><code>{p.id}</code></span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button type="submit" disabled={submitting}>Save</Button>
            <Button type="button" onClick={closeModal} variant="secondary">Cancel</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Delete role "${roleToDelete?.name}"? This may affect users assigned to this role.`}
      />
    </section>
  );
}
