import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useBoards } from '../context/BoardContext';
import { SortableList } from '../components/SortableList';
import { AddListForm } from '../components/AddListForm';
import { CardModal } from '../components/CardModal';
import { CardItem } from '../components/CardItem';
import { BoardHeader } from '../components/BoardHeader';
import { BoardToolbar } from '../components/BoardToolbar';
import { ArchiveDrawer } from '../components/ArchiveDrawer';
import styles from './BoardPage.module.css';

export function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const {
    activeBoard,
    loading,
    error,
    fetchBoard,
    fetchMeta,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    archiveList,
    reorderLists,
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    moveCard,
    reorderCards,
    addChecklist,
    updateChecklist,
    deleteChecklist,
    addComment,
    deleteComment,
    searchCards,
    clearSearch,
    searchResults,
    clearError,
  } = useBoards();

  const [selected, setSelected] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [filterLabels, setFilterLabels] = useState([]);
  const [filterMembers, setFilterMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBoard(boardId);
    fetchMeta();
  }, [boardId, fetchBoard, fetchMeta]);

  const lists = useMemo(() => activeBoard?.lists ?? [], [activeBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter cards based on labels and members
  const filteredLists = useMemo(() => {
    if (filterLabels.length === 0 && filterMembers.length === 0 && !searchQuery) {
      return lists;
    }
    return lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const matchLabels = filterLabels.length === 0 || filterLabels.some((l) => card.labels?.includes(l));
        const matchMembers = filterMembers.length === 0 || filterMembers.some((m) => card.members?.includes(m));
        const matchSearch = !searchQuery || 
          card.content?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.content?.body?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchLabels && matchMembers && matchSearch;
      }),
    }));
  }, [lists, filterLabels, filterMembers, searchQuery]);

  const findListByCardId = useCallback((cardId) => {
    for (const list of lists) {
      if (list.cards.some((c) => c.id === cardId)) {
        return list;
      }
    }
    return null;
  }, [lists]);

  const findCardById = useCallback((cardId) => {
    for (const list of lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  }, [lists]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveType(active.data.current?.type || 'card');
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // List reordering
    if (activeData?.type === 'list' && overData?.type === 'list') {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex !== newIndex) {
        const newOrder = [...lists];
        const [moved] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, moved);
        await reorderLists(boardId, newOrder.map((l) => l.id));
      }
      return;
    }

    // Card movement
    if (activeData?.type === 'card') {
      const sourceList = findListByCardId(active.id);
      if (!sourceList) return;

      let targetListId = overData?.listId || over.id;
      let targetList = lists.find((l) => l.id === targetListId);

      // If dropping on a card, get its list
      if (overData?.type === 'card') {
        const overList = findListByCardId(over.id);
        if (overList) {
          targetList = overList;
          targetListId = overList.id;
        }
      }

      if (!targetList) return;

      // Calculate new position
      let newPosition = 0;
      if (overData?.type === 'card') {
        const overIndex = targetList.cards.findIndex((c) => c.id === over.id);
        newPosition = overIndex >= 0 ? overIndex : targetList.cards.length;
      } else {
        newPosition = targetList.cards.length;
      }

      // Same list reorder
      if (sourceList.id === targetList.id) {
        const cardIds = targetList.cards.map((c) => c.id);
        const oldIndex = cardIds.indexOf(active.id);
        if (oldIndex !== newPosition && oldIndex !== -1) {
          cardIds.splice(oldIndex, 1);
          cardIds.splice(newPosition > oldIndex ? newPosition - 1 : newPosition, 0, active.id);
          await reorderCards(boardId, targetList.id, cardIds);
        }
      } else {
        // Move to different list
        await moveCard(boardId, active.id, sourceList.id, targetListId, newPosition);
        playCompletionSound(targetList);
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.data.current?.type !== 'card') return;

    const activeList = findListByCardId(active.id);
    const overData = over.data.current;
    let overListId = overData?.listId || over.id;

    if (overData?.type === 'card') {
      const overList = findListByCardId(over.id);
      if (overList) overListId = overList.id;
    }

    if (activeList && activeList.id !== overListId) {
      // Visual feedback for cross-list drag is handled by optimistic updates
    }
  };

  const playCompletionSound = (targetList) => {
    if (targetList && /done|complete/i.test(targetList.title)) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.connect(gain).connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      } catch {
        // Audio not available
      }
    }
  };

  const handleOpenCard = (card, listId) => {
    setSelected({ card, listId });
  };

  const handleSaveCard = async (cardId, payload) => {
    await updateCard(boardId, cardId, payload);
  };

  const handleDeleteBoard = async () => {
    if (window.confirm('Delete this board? This cannot be undone.')) {
      await deleteBoard(boardId);
      navigate('/');
    }
  };

  const getBackground = () => {
    if (!activeBoard?.background) return {};
    const bg = activeBoard.background;
    if (bg.type === 'gradient') {
      return { background: bg.value };
    }
    return { backgroundColor: bg.value };
  };

  if (!activeBoard && loading) {
    return <div className={styles.loading}>Loading board…</div>;
  }

  if (!activeBoard) {
    return (
      <div className={styles.loading}>
        Board not found. <button onClick={() => navigate('/')}>Go back</button>
      </div>
    );
  }

  const activeCard = activeId && activeType === 'card' ? findCardById(activeId) : null;
  const activeList = activeId && activeType === 'list' ? lists.find((l) => l.id === activeId) : null;

  return (
    <section className={styles.page} style={getBackground()}>
      {error && (
        <div className={styles.banner} role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <BoardHeader
        board={activeBoard}
        onUpdate={(payload) => updateBoard(boardId, payload)}
        onDelete={handleDeleteBoard}
      />

      <BoardToolbar
        board={activeBoard}
        filterLabels={filterLabels}
        filterMembers={filterMembers}
        searchQuery={searchQuery}
        onFilterLabels={setFilterLabels}
        onFilterMembers={setFilterMembers}
        onSearch={setSearchQuery}
        onShowArchive={() => setShowArchive(true)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.boardWrapper}>
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            <div className={styles.board}>
              {filteredLists.map((list) => (
                <SortableList
                  key={list.id}
                  list={list}
                  boardLabels={activeBoard.labels}
                  boardMembers={activeBoard.members}
                  onCreateCard={(listId, payload) => createCard(boardId, listId, payload)}
                  onOpenCard={(card) => handleOpenCard(card, list.id)}
                  onUpdateList={(listId, payload) => updateList(boardId, listId, payload)}
                  onArchiveList={() => archiveList(boardId, list.id)}
                  onDeleteList={() => deleteList(boardId, list.id)}
                />
              ))}
              <AddListForm onCreate={(payload) => createList(boardId, payload)} />
            </div>
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeCard && (
            <div className={styles.dragOverlay}>
              <CardItem
                card={activeCard}
                boardLabels={activeBoard.labels}
                isDragging
              />
            </div>
          )}
          {activeList && (
            <div className={styles.listOverlay}>
              <div className={styles.listPlaceholder}>
                <h3>{activeList.title}</h3>
                <span>{activeList.cards.length} cards</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selected && (
        <CardModal
          card={selected.card}
          listId={selected.listId}
          lists={lists}
          boardLabels={activeBoard.labels}
          boardMembers={activeBoard.members}
          onClose={() => setSelected(null)}
          onSave={(payload) => handleSaveCard(selected.card.id, payload)}
          onArchive={async () => {
            await archiveCard(boardId, selected.card.id);
            setSelected(null);
          }}
          onDelete={async () => {
            await deleteCard(boardId, selected.card.id);
            setSelected(null);
          }}
          onMove={async (targetListId) => {
            await moveCard(boardId, selected.card.id, selected.listId, targetListId);
            playCompletionSound(lists.find((l) => l.id === targetListId));
          }}
          onAddChecklist={(payload) => addChecklist(boardId, selected.card.id, payload)}
          onUpdateChecklist={(checklistId, payload) =>
            updateChecklist(boardId, selected.card.id, checklistId, payload)
          }
          onDeleteChecklist={(checklistId) =>
            deleteChecklist(boardId, selected.card.id, checklistId)
          }
          onAddComment={(payload) => addComment(boardId, selected.card.id, payload)}
          onDeleteComment={(commentId) =>
            deleteComment(boardId, selected.card.id, commentId)
          }
        />
      )}

      {showArchive && (
        <ArchiveDrawer
          boardId={boardId}
          onClose={() => setShowArchive(false)}
        />
      )}
    </section>
  );
}
