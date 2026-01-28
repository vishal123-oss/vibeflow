import styles from './NodeEditor.module.css';

export function NodeEditor({ lists }) {
  const nodes = lists.flatMap((list, listIndex) =>
    list.cards.map((card, cardIndex) => ({
      id: card.id,
      title: card.content?.title ?? 'Untitled',
      list: list.title,
      x: 60 + listIndex * 260,
      y: 80 + cardIndex * 140,
    }))
  );

  return (
    <div className={styles.canvas}>
      <svg className={styles.svg} aria-hidden="true">
        {nodes.map((node, idx) => (
          <line
            key={`line-${node.id}`}
            x1={node.x + 140}
            y1={node.y + 20}
            x2={nodes[idx + 1]?.x ?? node.x + 140}
            y2={nodes[idx + 1]?.y ?? node.y + 20}
          />
        ))}
      </svg>
      {nodes.map((node) => (
        <div key={node.id} className={styles.node} style={{ left: node.x, top: node.y }}>
          <span className={styles.list}>{node.list}</span>
          <strong>{node.title}</strong>
        </div>
      ))}
      {nodes.length === 0 && <p className={styles.empty}>Add cards to see the flow map.</p>}
    </div>
  );
}
