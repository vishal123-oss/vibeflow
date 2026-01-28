import { useState } from 'react';
import { TaskList } from '../components/TaskList';
import { useTasks } from '../context/TaskContext';
import styles from './TasksPage.module.css';

const ASSIGNEES = ['User1', 'User2'];
const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const initialForm = {
  title: '',
  body: '',
  assignee: '',
  priority: 'medium',
  labels: '',
};

export function TasksPage() {
  const { addTask, resetTasks, loading } = useTasks();
  const [form, setForm] = useState(initialForm);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const labels = form.labels
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean);

    await addTask({
      content: { title: form.title.trim(), body: form.body.trim() },
      meta: {
        assignee: form.assignee,
        labels,
        priority: form.priority,
      },
    });

    setForm(initialForm);
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Tasks</h2>
          <p>Track individual work items and filter by priority or labels.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.reset} onClick={resetTasks} disabled={loading}>
            {loading ? 'Resetting…' : 'Load demo tasks'}
          </button>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            placeholder="e.g. Ship kanban filters"
            value={form.title}
            onChange={handleChange('title')}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="task-body">Details</label>
          <textarea
            id="task-body"
            rows={3}
            placeholder="Describe the task"
            value={form.body}
            onChange={handleChange('body')}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="task-assignee">Assignee</label>
          <select id="task-assignee" value={form.assignee} onChange={handleChange('assignee')}>
            <option value="">Unassigned</option>
            {ASSIGNEES.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="task-priority">Priority</label>
          <select id="task-priority" value={form.priority} onChange={handleChange('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="task-labels">Labels</label>
          <input
            id="task-labels"
            type="text"
            placeholder="backend, design"
            value={form.labels}
            onChange={handleChange('labels')}
          />
        </div>
        <div className={styles.actionsRow}>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </form>

      <TaskList />
    </section>
  );
}
