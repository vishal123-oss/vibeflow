import { useEffect, useState } from 'react';
import { useBoards } from '../context/BoardContext';
import styles from './ArchiveDrawer.module.css';

export function ArchiveDrawer({ boardId, onClose }) {
  const {
    archivedCards,
    archivedLists,
    fetchArchivedCards,
    fetchArchivedLists,
    restoreCard,
    restoreList,
  } = useBoards();

  const [tab, setTab] = useState('cards');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchArchivedCards(boardId), fetchArchivedLists(boardId)]);
      setLoading(false);
    };
    load();
  }, [boardId, fetchArchivedCards, fetchArchivedLists]);

  const handleRestoreCard = async (cardId) => {
    await restoreCard(boardId, cardId);
  };

  const handleRestoreList = async (listId) => {
    await restoreList(boardId, listId);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Archive</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'cards' ? styles.activeTab : ''}
            onClick={() => setTab('cards')}
          >
            Cards ({archivedCards.length})
          </button>
          <button
            type="button"
            className={tab === 'lists' ? styles.activeTab : ''}
            onClick={() => setTab('lists')}
          >
            Lists ({archivedLists.length})
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <p className={styles.empty}>Loading...</p>
          ) : tab === 'cards' ? (
            archivedCards.length === 0 ? (
              <p className={styles.empty}>No archived cards</p>
            ) : (
              <ul className={styles.list}>
                {archivedCards.map((card) => (
                  <li key={card.id} className={styles.item}>
                    <div className={styles.itemContent}>
                      <strong>{card.content?.title || 'Untitled'}</strong>
                      <span className={styles.listName}>in {card.listTitle}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.restoreBtn}
                      onClick={() => handleRestoreCard(card.id)}
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : archivedLists.length === 0 ? (
            <p className={styles.empty}>No archived lists</p>
          ) : (
            <ul className={styles.list}>
              {archivedLists.map((list) => (
                <li key={list.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <strong>{list.title}</strong>
                    <span className={styles.listName}>
                      {list.cards?.length || 0} cards
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.restoreBtn}
                    onClick={() => handleRestoreList(list.id)}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
