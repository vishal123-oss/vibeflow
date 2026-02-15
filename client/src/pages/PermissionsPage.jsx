import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './PermissionsPage.module.css';

// Common categories from backend permissions DB (data/permissions/*.json)
const CATEGORIES = ['rbac', 'boards', 'tasks', 'workspaces', 'users'];

const initialForm = {
  id: '',
  name: '',
  description: '',
  category: 'rbac',
};

export function PermissionsPage() {
  const { 
    isSuperAdmin, 
    permissions, 
    fetchPermissions, 
    createPermission, 
    updatePermission, 
    deletePermission,
    loading: authLoading 
  } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect non-super_admin (UI only for super admin as per task; backend also guards)
  // super_admin is the only role with permissions:crud + roles:crud from data/roles/super_admin.json
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate('/'); // redirect to boards; UI hidden
    }
  }, [isSuperAdmin, authLoading, navigate]);

  // Refresh list (e.g., after other ops)
  useEffect(() => {
    if (isSuperAdmin) {
      fetchPermissions();
    }
  }, [isSuperAdmin, fetchPermissions]);

  if (authLoading || !isSuperAdmin) {
    return <div className={styles.page}>Loading or access denied...</div>;
  }

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setError('Name and description required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        // Update: PATCH /api/auth/permissions/:id (superAdmin only)
        await updatePermission(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
        });
      } else {
        // Create: POST /api/auth/permissions (id optional; meaningful like 'boards:delete' or auto)
        // Backend: permStore.savePermission -> storage, id from body or fallback
        await createPermission({
          id: form.id.trim() || undefined, // allow custom id for perms like 'rbac:manage'
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
        });
      }
      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed (check super_admin perms)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (perm) => {
    setForm({
      id: perm.id,
      name: perm.name,
      description: perm.description,
      category: perm.category,
    });
    setEditingId(perm.id);
  };

  const handleDelete = async (permId) => {
    if (!confirm('Delete this permission? This may affect roles.')) return;
    try {
      // DELETE /api/auth/permissions/:id (superAdmin only; backend deleteRecord)
      await deletePermission(permId);
    } catch (err) {
      setError('Delete failed');
    }
  };

  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setError('');
  };

  // Sort/group by category for UI like Jira RBAC mgmt
  const groupedPerms = permissions.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Permissions Management</h2>
          <p>Super Admin only: CRUD permissions from backend FS DB (data/permissions/). Integrates with RBAC (roles reference perm IDs).</p>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit' : 'Create'} Permission</h3>
        {!editingId && (
          <div className={styles.field}>
            <label htmlFor="perm-id">ID (e.g., boards:delete or permissions:crud)</label>
            <input
              id="perm-id"
              type="text"
              placeholder="boards:delete (optional; auto if empty)"
              value={form.id}
              onChange={handleChange('id')}
            />
          </div>
        )}
        <div className={styles.field}>
          <label htmlFor="perm-name">Name</label>
          <input
            id="perm-name"
            type="text"
            placeholder="e.g., Delete Boards"
            value={form.name}
            onChange={handleChange('name')}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="perm-desc">Description</label>
          <textarea
            id="perm-desc"
            rows={2}
            placeholder="What this permission allows"
            value={form.description}
            onChange={handleChange('description')}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="perm-category">Category</label>
          <select id="perm-category" value={form.category} onChange={handleChange('category')}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className={styles.cancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        <h3>Existing Permissions ({permissions.length})</h3>
        {Object.entries(groupedPerms).map(([cat, perms]) => (
          <section key={cat} className={styles.category}>
            <h4>{cat.toUpperCase()}</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {perms.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id}</code></td>
                    <td>{p.name}</td>
                    <td>{p.description}</td>
                    <td>
                      <button onClick={() => handleEdit(p)} className={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className={styles.deleteBtn}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </section>
  );
}