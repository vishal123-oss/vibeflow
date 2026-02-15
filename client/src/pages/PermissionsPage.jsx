import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './PermissionsPage.module.css';

// Common categories from backend permissions DB (data/permissions/*.json)
const CATEGORIES = ['rbac', 'boards', 'tasks', 'workspaces', 'users'];

// Sort options for filters (enhanced UX like Jira/Trello admin panels)
const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
];

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

  // Form/modal state for CRUD (moved to modal for better UX)
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls create/edit modal visibility
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // Per-field validation errors

  // Filter state for enhanced UX (search, category, sort - like Jira RBAC views)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('id');

  // Redirect non-super_admin (UI only for super admin as per task; backend also guards)
  // super_admin is the only role with permissions:crud + roles:crud from data/roles/super_admin.json
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate('/'); // redirect to boards; UI hidden
    }
  }, [isSuperAdmin, authLoading, navigate]);

  // Refresh list (e.g., after CRUD ops)
  useEffect(() => {
    if (isSuperAdmin) {
      fetchPermissions();
    }
  }, [isSuperAdmin, fetchPermissions]);

  // Close modal on ESC for better UX
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isModalOpen) closeModal();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  if (authLoading || !isSuperAdmin) {
    return <div className={styles.page}>Loading or access denied...</div>;
  }

  // Validation for form fields (proper checks: required, unique ID for create, length etc.)
  // Integrates with backend constraints (e.g., unique perm ID in FS storage)
  const validateForm = () => {
    const errors = {};
    if (!form.id.trim() && !editingId) {
      errors.id = 'Permission ID is required (e.g., boards:delete)';
    } else if (!editingId) {
      // Check uniqueness vs existing perms (from backend FS DB)
      const idExists = permissions.some(p => p.id.toLowerCase() === form.id.trim().toLowerCase());
      if (idExists) errors.id = 'ID already exists (must be unique)';
    }
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.category) errors.category = 'Category is required';
    if (form.id.trim().length > 50) errors.id = 'ID too long (max 50 chars)';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form handlers (shared for modal)
  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    // Clear field error on change for UX
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    setError('');
  };

  // Modal controls (for create/edit - better UX than inline form)
  const openModal = (perm = null) => {
    if (perm) {
      // Edit mode
      setForm({
        id: perm.id,
        name: perm.name,
        description: perm.description,
        category: perm.category,
      });
      setEditingId(perm.id);
    } else {
      // Create mode
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
      setError('Please fix validation errors');
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
        // Create: POST /api/auth/permissions (id required for meaningful keys; backend permStore.savePermission handles)
        // e.g., id='boards:delete' links to roles
        await createPermission({
          id: form.id.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
        });
      }
      closeModal(); // Close on success
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed (check super_admin perms)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (perm) => {
    openModal(perm); // Open modal in edit mode
  };

  const handleDelete = async (permId) => {
    if (!confirm(`Delete permission "${permId}"? This may affect roles using it.`)) return;
    try {
      // DELETE /api/auth/permissions/:id (superAdmin only; backend deleteRecord)
      await deletePermission(permId);
    } catch (err) {
      setError('Delete failed');
    }
  };

  // Filter logic for UX (search across fields, category, sort - multi-way filtering like Jira)
  // Applied before grouping for performant list
  const filteredPermissions = permissions
    .filter(p => {
      const matchesSearch = !searchTerm || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !filterCategory || p.category === filterCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'id') return a.id.localeCompare(b.id);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });

  // Open modal button for create (as requested; edit reuses via handleEdit)
  const handleCreateClick = () => openModal();

  // Filter handlers for multi-way UX (search, cat dropdown, sort - improves discovery in large perm lists)
  // Declared before filtered/grouped for const scoping/TDZ safety
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleCategoryFilter = (e) => setFilterCategory(e.target.value);
  const handleSortChange = (e) => setSortBy(e.target.value);
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setSortBy('id');
  };

  // Group filtered perms by category for organized display (uses filters for UX)
  const groupedPerms = filteredPermissions.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <section className={styles.page}>
      {/* Header with improved alignment + filters button/modal trigger */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2>Permissions Management</h2>
          <p>Super Admin only: CRUD permissions from backend FS DB (data/permissions/). Integrates with RBAC (roles reference perm IDs).</p>
        </div>
        <div className={styles.headerActions}>
          {/* Create button opens modal (better UX than inline form) */}
          <button onClick={handleCreateClick} className={styles.createBtn} disabled={submitting}>
            + Create Permission
          </button>
        </div>
      </header>

      {/* Global error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Filters bar for better UX (search, category, sort - multi-filter like Jira) */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by ID, name, or description..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <select value={filterCategory} onChange={handleCategoryFilter}>
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={sortBy} onChange={handleSortChange}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {(searchTerm || filterCategory || sortBy !== 'id') && (
          <button onClick={clearFilters} className={styles.clearBtn}>Clear Filters</button>
        )}
        <span className={styles.filterCount}>
          Showing {filteredPermissions.length} of {permissions.length} permissions
        </span>
      </div>

      {/* Modal for create/edit (overlay, form inside - pixel-perfect, accessible) */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h3>{editingId ? 'Edit' : 'Create'} Permission</h3>
              <button onClick={closeModal} className={styles.closeModal} aria-label="Close">×</button>
            </header>
            <form className={styles.modalForm} onSubmit={handleSubmit}>
              {/* ID field only for create; validation error inline */}
              {!editingId && (
                <div className={styles.field}>
                  <label htmlFor="perm-id">ID * (e.g., boards:delete or permissions:crud - must be unique)</label>
                  <input
                    id="perm-id"
                    type="text"
                    placeholder="boards:delete"
                    value={form.id}
                    onChange={handleChange('id')}
                    className={fieldErrors.id ? styles.inputError : ''}
                    required
                  />
                  {fieldErrors.id && <span className={styles.fieldError}>{fieldErrors.id}</span>}
                </div>
              )}
              <div className={styles.field}>
                <label htmlFor="perm-name">Name *</label>
                <input
                  id="perm-name"
                  type="text"
                  placeholder="e.g., Delete Boards"
                  value={form.name}
                  onChange={handleChange('name')}
                  className={fieldErrors.name ? styles.inputError : ''}
                  required
                />
                {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="perm-desc">Description *</label>
                <textarea
                  id="perm-desc"
                  rows={3}
                  placeholder="What this permission allows (e.g., allows deleting boards in workspaces)"
                  value={form.description}
                  onChange={handleChange('description')}
                  className={fieldErrors.description ? styles.inputError : ''}
                  required
                />
                {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="perm-category">Category *</label>
                <select 
                  id="perm-category" 
                  value={form.category} 
                  onChange={handleChange('category')}
                  className={fieldErrors.category ? styles.inputError : ''}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {fieldErrors.category && <span className={styles.fieldError}>{fieldErrors.category}</span>}
              </div>
              <div className={styles.modalActions}>
                <button type="submit" disabled={submitting} className={styles.submitBtn}>
                  {submitting ? 'Saving…' : editingId ? 'Update Permission' : 'Create Permission'}
                </button>
                <button type="button" onClick={closeModal} className={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions list - uses filtered/grouped data for UX; actions open modal or delete */}
      <div className={styles.list}>
        <h3>Existing Permissions ({filteredPermissions.length})</h3>
        {Object.keys(groupedPerms).length === 0 ? (
          <p className={styles.empty}>No permissions match your filters. <button onClick={clearFilters}>Clear filters</button></p>
        ) : (
          Object.entries(groupedPerms).map(([cat, perms]) => (
            <section key={cat} className={styles.category}>
              <h4>{cat.toUpperCase()} ({perms.length})</h4>
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
          ))
        )}
      </div>
    </section>
  );
}