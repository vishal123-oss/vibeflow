import { useEffect, useState } from 'react';
import { ChecklistSection } from './ChecklistSection';
import { CommentsSection } from './CommentsSection';
import { ActivitySection } from './ActivitySection';
import { LabelPicker } from './LabelPicker';
import { MemberPicker } from './MemberPicker';
import { CoverPicker } from './CoverPicker';
import styles from './CardModal.module.css';

export function CardModal({
  card,
  listId,
  lists,
  boardLabels,
  boardMembers,
  onClose,
  onSave,
  onArchive,
  onDelete,
  onMove,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onAddComment,
  onDeleteComment,
}) {
  const [title, setTitle] = useState(card.content?.title ?? '');
  const [body, setBody] = useState(card.content?.body ?? '');
  const [labels, setLabels] = useState(card.labels ?? []);
  const [members, setMembers] = useState(card.members ?? []);
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [dueComplete, setDueComplete] = useState(card.dueComplete ?? false);
  const [cover, setCover] = useState(card.cover);
  const [targetList, setTargetList] = useState('');

  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBody, setEditingBody] = useState(false);

  useEffect(() => {
    setTitle(card.content?.title ?? '');
    setBody(card.content?.body ?? '');
    setLabels(card.labels ?? []);
    setMembers(card.members ?? []);
    setDueDate(card.dueDate ?? '');
    setDueComplete(card.dueComplete ?? false);
    setCover(card.cover);
    setTargetList('');
  }, [card.id]);

  // Auto-save changes
  const saveChanges = async (updates = {}) => {
    await onSave({
      content: { title: title.trim(), body: body.trim() },
      labels,
      members,
      dueDate: dueDate || null,
      dueComplete,
      cover,
      ...updates,
    });
  };

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (title.trim() !== card.content?.title) {
      await saveChanges();
    }
  };

  const handleBodyBlur = async () => {
    setEditingBody(false);
    if (body.trim() !== card.content?.body) {
      await saveChanges();
    }
  };

  const handleLabelsChange = async (newLabels) => {
    setLabels(newLabels);
    await onSave({ labels: newLabels });
  };

  const handleMembersChange = async (newMembers) => {
    setMembers(newMembers);
    await onSave({ members: newMembers });
  };

  const handleCoverChange = async (newCover) => {
    setCover(newCover);
    await onSave({ cover: newCover });
    setShowCoverPicker(false);
  };

  const handleDueDateChange = async (e) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    await onSave({ dueDate: newDate || null });
  };

  const handleDueCompleteToggle = async () => {
    const newValue = !dueComplete;
    setDueComplete(newValue);
    await onSave({ dueComplete: newValue });
  };

  const handleMove = async () => {
    if (!targetList) return;
    await onMove(targetList);
    setTargetList('');
    onClose();
  };

  const handleAddChecklist = async () => {
    await onAddChecklist({ title: 'Checklist' });
  };

  const currentListName = lists.find((l) => l.id === listId)?.title || 'Unknown';

  // Calculate checklist progress
  const checklists = card.checklists ?? [];
  const checklistItems = checklists.flatMap((c) => c.items || []);
  const completedItems = checklistItems.filter((i) => i.completed).length;
  const totalItems = checklistItems.length;

  // Get label objects
  const labelObjects = labels
    .map((labelId) => boardLabels.find((l) => l.id === labelId))
    .filter(Boolean);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {cover && (
          <div
            className={styles.coverBar}
            style={
              cover.type === 'color'
                ? { backgroundColor: cover.value }
                : cover.type === 'gradient'
                ? { background: cover.value }
                : {}
            }
          />
        )}

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <div className={styles.content}>
          <div className={styles.main}>
            {/* Title */}
            <div className={styles.titleSection}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className={styles.icon}>
                <path d="M4 5h16v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
              </svg>
              {editingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  className={styles.titleInput}
                  autoFocus
                />
              ) : (
                <h2 className={styles.title} onClick={() => setEditingTitle(true)}>
                  {title || 'Untitled'}
                </h2>
              )}
            </div>
            <p className={styles.listInfo}>
              in list <strong>{currentListName}</strong>
            </p>

            {/* Labels */}
            {labelObjects.length > 0 && (
              <div className={styles.section}>
                <h4>Labels</h4>
                <div className={styles.labelsDisplay}>
                  {labelObjects.map((label) => (
                    <span
                      key={label.id}
                      className={styles.labelBadge}
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            {members.length > 0 && (
              <div className={styles.section}>
                <h4>Members</h4>
                <div className={styles.membersDisplay}>
                  {members.map((member) => {
                    // Handle string id or object {id, name, initials}
                    const id = typeof member === 'string' ? member : member.id || member;
                    const memberObj = boardMembers.find((m) => m.id === id) || (typeof member === 'object' ? member : {});
                    return (
                      <span key={id} className={styles.memberAvatar} title={memberObj?.name || id}>
                        {memberObj?.initials || (typeof id === 'string' ? id.slice(0, 2).toUpperCase() : '??')}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Due Date */}
            {dueDate && (
              <div className={styles.section}>
                <h4>Due Date</h4>
                <div className={styles.dueDisplay}>
                  <input
                    type="checkbox"
                    checked={dueComplete}
                    onChange={handleDueCompleteToggle}
                    className={styles.dueCheck}
                  />
                  <span className={dueComplete ? styles.dueComplete : ''}>
                    {new Date(dueDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {dueComplete && <span className={styles.completeTag}>Complete</span>}
                </div>
              </div>
            )}

            {/* Description */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M4 5h16v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
                </svg>
                <h4>Description</h4>
              </div>
              {editingBody ? (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onBlur={handleBodyBlur}
                  className={styles.bodyInput}
                  rows={6}
                  placeholder="Add a more detailed description..."
                  autoFocus
                />
              ) : (
                <div
                  className={styles.bodyDisplay}
                  onClick={() => setEditingBody(true)}
                >
                  {body || 'Add a more detailed description...'}
                </div>
              )}
            </div>

            {/* Checklists */}
            {checklists.length > 0 && (
              <ChecklistSection
                checklists={checklists}
                onUpdate={onUpdateChecklist}
                onDelete={onDeleteChecklist}
              />
            )}

            {/* Comments */}
            <CommentsSection
              comments={card.comments ?? []}
              boardMembers={boardMembers}
              onAdd={onAddComment}
              onDelete={onDeleteComment}
            />

            {/* Activity */}
            <ActivitySection
              activity={card.activity ?? []}
              boardMembers={boardMembers}
            />
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <h5>Add to card</h5>
              <button
                type="button"
                className={styles.sidebarBtn}
                onClick={() => setShowMemberPicker(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                Members
              </button>
              <button
                type="button"
                className={styles.sidebarBtn}
                onClick={() => setShowLabelPicker(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
                </svg>
                Labels
              </button>
              <button type="button" className={styles.sidebarBtn} onClick={handleAddChecklist}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                Checklist
              </button>
              <div className={styles.dueDateInput}>
                <label>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
                  </svg>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate || ''}
                  onChange={handleDueDateChange}
                  className={styles.dateInput}
                />
              </div>
              <button
                type="button"
                className={styles.sidebarBtn}
                onClick={() => setShowCoverPicker(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
                Cover
              </button>
            </div>

            <div className={styles.sidebarSection}>
              <h5>Actions</h5>
              <div className={styles.moveAction}>
                <select value={targetList} onChange={(e) => setTargetList(e.target.value)}>
                  <option value="">Move to…</option>
                  {lists
                    .filter((l) => l.id !== listId)
                    .map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                </select>
                {targetList && (
                  <button type="button" onClick={handleMove}>
                    Move
                  </button>
                )}
              </div>
              <button type="button" className={styles.sidebarBtn} onClick={onArchive}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                </svg>
                Archive
              </button>
              <button type="button" className={`${styles.sidebarBtn} ${styles.danger}`} onClick={onDelete}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Delete
              </button>
            </div>
          </aside>
        </div>

        {/* Pickers */}
        {showLabelPicker && (
          <LabelPicker
            selectedLabels={labels}
            boardLabels={boardLabels}
            onChange={handleLabelsChange}
            onClose={() => setShowLabelPicker(false)}
          />
        )}

        {showMemberPicker && (
          <MemberPicker
            selectedMembers={members}
            boardMembers={boardMembers}
            onChange={handleMembersChange}
            onClose={() => setShowMemberPicker(false)}
          />
        )}

        {showCoverPicker && (
          <CoverPicker
            currentCover={cover}
            onChange={handleCoverChange}
            onClose={() => setShowCoverPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
