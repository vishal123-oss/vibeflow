import { useState } from 'react';
import styles from './TimelineView.module.css';

export function TimelineView({ lists, boardLabels, boardMembers }) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  // Flatten and sort cards by creation date (assuming history[0] is creation)
  const allCards = lists
    .flatMap((list) =>
      list.cards.map((card) => ({
        ...card,
        listTitle: list.title,
        listId: list.id,
        createdAt: card.history?.[0]?.timestamp ? new Date(card.history[0].timestamp) : new Date(),
      }))
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  const getStatusColor = (listId) => {
    const colors = ['#007bff', '#ffc107', '#28a745', '#dc3545', '#6f42c1', '#fd7e14'];
    const index = lists.findIndex((l) => l.id === listId);
    return colors[index % colors.length];
  };

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

  const toggleExpanded = (cardId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  return (
    <div className={styles.timelineWrapper}>
      <div className={styles.timeline}>
        {allCards.map((card, index) => {
          const isExpanded = expandedItems.has(card.id);
          return (
            <div key={card.id} className={styles.timelineItem}>
              <div className={styles.timelineMarker} style={{ backgroundColor: getStatusColor(card.listId) }}></div>
              <div className={styles.timelineContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>{card.content?.title || ''}</h3>
                    <button
                      onClick={() => toggleExpanded(card.id)}
                      className={styles.expandButton}
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                  <div className={styles.cardSummary}>
                    <span className={styles.statusTag} style={{ backgroundColor: getStatusColor(card.listId) }}>
                      {card.listTitle}
                    </span>
                    <span className={styles.date}>
                      {card.createdAt.toLocaleDateString()}
                    </span>
                    {getMemberNames(card.members) && (
                      <span className={styles.assignee}>
                        {getMemberNames(card.members)}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className={styles.cardDetails}>
                    <div className={styles.cardMeta}>
                      <div className={styles.labels}>
                        {getLabelTags(card.labels)}
                      </div>
                    </div>
                    {card.content?.body && (
                      <p className={styles.cardBody}>{card.content.body}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {allCards.length === 0 && (
        <p className={styles.empty}>No cards to display.</p>
      )}
    </div>
  );
}