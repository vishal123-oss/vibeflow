import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableCard } from './SortableCard';
import { AddCardForm } from './AddCardForm';
import styles from './SortableList.module.css';

export function SortableList({
  list,
  boardLabels,
  boardMembers,
  onCreateCard,
  onOpenCard,
  onUpdateList,
  onArchiveList,
  onDeleteList,
  color,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: { type: 'list', list },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const submitTitle = async (e) => {
    e.preventDefault();
    setEditing(false);
    if (!title.trim()) {
      setTitle(list.title);
      return;
    }
    if (title.trim() !== list.title) {
      await onUpdateList(list.id, { title: title.trim() });
    }
  };

  const handleArchive = async () => {
    setShowMenu(false);
    await onArchiveList();
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (window.confirm(`Delete "${list.title}" and all its cards?`)) {
      await onDeleteList();
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.column}>
      <div className={styles.header} style={{ borderTopColor: color }} {...attributes} {...listeners}>
        {editing ? (
          <form onSubmit={submitTitle} className={styles.editForm}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={submitTitle}
              autoFocus
            />
          </form>
        ) : (
          <h3 onDoubleClick={() => setEditing(true)} className={styles.title}>
            {list.title}
            <span className={styles.count}>{list.cards.length}</span>
          </h3>
        )}
        <div className={styles.menuWrapper}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="List menu"
          >
            ⋯
          </button>
          {showMenu && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setShowMenu(false)} />
              <div className={styles.menu}>
                <button onClick={handleArchive}>Archive list</button>
                <button onClick={handleDelete} className={styles.danger}>
                  Delete list
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className={styles.cards} data-list-id={list.id}>
          {list.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              listId={list.id}
              boardLabels={boardLabels}
              onOpen={() => onOpenCard(card)}
            />
          ))}
        </div>
      </SortableContext>

      <AddCardForm onCreate={(payload) => onCreateCard(list.id, payload)} />
    </div>
  );
}
