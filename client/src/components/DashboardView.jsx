import styles from './DashboardView.module.css';

export function DashboardView({ lists, boardLabels, boardMembers }) {
  const totalCards = lists.reduce((sum, list) => sum + list.cards.length, 0);
  const totalMembers = boardMembers?.length || 0;
  const totalLabels = boardLabels?.length || 0;

  const listStats = lists.map((list) => ({
    title: list.title,
    count: list.cards.length,
    percentage: totalCards > 0 ? Math.round((list.cards.length / totalCards) * 100) : 0,
    color: getStatusColor(lists.findIndex((l) => l.id === list.id)),
  }));

  const labelStats = boardLabels?.map((label) => ({
    name: label.name,
    count: lists.flatMap((list) => list.cards).filter((card) => card.labels?.includes(label.id)).length,
    color: label.color,
  })) || [];

  function getStatusColor(index) {
    const colors = ['#007bff', '#ffc107', '#28a745', '#dc3545', '#6f42c1', '#fd7e14'];
    return colors[index % colors.length];
  }

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Tasks</h3>
          <div className={styles.statNumber}>{totalCards}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Members</h3>
          <div className={styles.statNumber}>{totalMembers}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Labels</h3>
          <div className={styles.statNumber}>{totalLabels}</div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <h3>Tasks by Status</h3>
        <div className={styles.barChart}>
          {listStats.map((stat) => (
            <div key={stat.title} className={styles.barItem}>
              <div className={styles.barLabel}>
                <span className={styles.statusDot} style={{ backgroundColor: stat.color }}></span>
                {stat.title}
              </div>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{
                    width: `${stat.percentage}%`,
                    backgroundColor: stat.color,
                  }}
                ></div>
              </div>
              <div className={styles.barValue}>{stat.count} ({stat.percentage}%)</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chartSection}>
        <h3>Tasks by Labels</h3>
        <div className={styles.labelStats}>
          {labelStats.map((stat) => (
            <div key={stat.name} className={styles.labelStat}>
              <span className={styles.labelColor} style={{ backgroundColor: stat.color }}></span>
              <span className={styles.labelName}>{stat.name}</span>
              <span className={styles.labelCount}>{stat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}