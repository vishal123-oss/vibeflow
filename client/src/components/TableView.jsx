import { useState } from 'react';
import styles from './TableView.module.css';

export function TableView({ lists, boardLabels, boardMembers, onUpdateCard, onMoveCard }) {
  const [editingDescription, setEditingDescription] = useState(null);
  const [descriptionValue, setDescriptionValue] = useState('');
  // Flatten cards from all lists
  const allCards = lists.flatMap((list) =>
    list.cards.map((card) => ({
      ...card,
      listTitle: list.title,
      listId: list.id,
    }))
  );

  const getLabelTags = (labelIds) => {
    return labelIds?.map((id) => {
      const label = boardLabels?.find((l) => l.id === id);
      return label ? (
        <span key={id} className={styles.labelTag} style={{ backgroundColor: label.color }}>
          {label.name}
        </span>
      ) : null;
    }).filter(Boolean);
  };

  const getMemberNames = (memberIds) => {
    return memberIds
      ?.map((id) => boardMembers?.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '';
  };

  const getSubtasksStatus = (card) => {
    const checklists = card.checklists || [];
    if (checklists.length === 0) return 'No subtasks';
    const total = checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);
    const completed = checklists.reduce((sum, checklist) => sum + checklist.items.filter(item => item.completed).length, 0);
    return `${completed}/${total} completed`;
  };

  const getStatusColor = (listId) => {
    const colors = ['#007bff', '#ffc107', '#28a745', '#dc3545', '#6f42c1', '#fd7e14'];
    const index = lists.findIndex((l) => l.id === listId);
    return colors[index % colors.length];
  };

  const handleStatusChange = async (cardId, newListId) => {
    const card = allCards.find(c => c.id === cardId);
    if (card && card.listId !== newListId) {
      await onMoveCard(card.listId, newListId, cardId, 0); // Assuming move to top
    }
  };

  const handleAssigneeChange = async (cardId, newAssigneeId) => {
    const member = boardMembers?.find(m => m.id === newAssigneeId);
    if (member) {
      await onUpdateCard(cardId, { members: [newAssigneeId] }); // Assuming single assignee
    }
  };

  const startEditingDescription = (cardId, currentBody) => {
    setEditingDescription(cardId);
    setDescriptionValue(currentBody || '');
  };

  const cancelEditingDescription = () => {
    setEditingDescription(null);
    setDescriptionValue('');
  };

  const saveEditingDescription = async (cardId) => {
    await onUpdateCard(cardId, { content: { body: descriptionValue } });
    setEditingDescription(null);
    setDescriptionValue('');
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Subtasks</th>
            <th>Labels</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {allCards.map((card) => (
            <tr key={card.id}>
              <td className={styles.titleCell}>{card.content?.title || ''}</td>
              <td>
                <select
                  className={styles.statusSelect}
                  value={card.listId}
                  onChange={(e) => handleStatusChange(card.id, e.target.value)}
                  style={{ backgroundColor: getStatusColor(card.listId), color: 'white' }}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <div className={styles.assigneeContainer}>
                  {card.members?.[0] ? (
                    <div className={styles.assigneeDisplay}>
                      <div className={styles.assigneeAvatar}>
                        {boardMembers?.find(m => m.id === card.members[0])?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className={styles.assigneeName}>
                        {boardMembers?.find(m => m.id === card.members[0])?.name || 'Unknown'}
                      </span>
                    </div>
                  ) : (
                    <span className={styles.unassigned}>Unassigned</span>
                  )}
                  <select
                    className={styles.assigneeSelect}
                    value={card.members?.[0] || ''}
                    onChange={(e) => handleAssigneeChange(card.id, e.target.value)}
                    title="Change assignee"
                  >
                    <option value="">Unassigned</option>
                    {boardMembers?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td>
                <span className={`${styles.priorityBadge} ${styles.medium}`}>
                  Medium
                </span>
              </td>
              <td>
                {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : 'No due date'}
              </td>
              <td>
                {getSubtasksStatus(card)}
              </td>
              <td className={styles.labelsCell}>
                {getLabelTags(card.labels)}
              </td>
              <td className={styles.descriptionCell}>
                {editingDescription === card.id ? (
                  <div className={styles.editDescription}>
                    <textarea
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      className={styles.descriptionTextarea}
                    />
                    <div className={styles.editButtons}>
                      <button
                        onClick={() => saveEditingDescription(card.id)}
                        className={styles.okButton}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditingDescription}
                        className={styles.cancelButton}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.descriptionContainer}>
                    <span className={styles.descriptionText}>
                      {card.content?.body || 'No description'}
                    </span>
                    <button
                      onClick={() => startEditingDescription(card.id, card.content?.body || '')}
                      className={styles.editIcon}
                      title="Edit description"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {allCards.length === 0 && (
        <p className={styles.empty}>No cards to display.</p>
      )}
    </div>
  );
}