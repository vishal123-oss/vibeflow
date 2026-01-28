import styles from './CoverPicker.module.css';

const COVER_COLORS = [
  '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
  '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
  'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
];

export function CoverPicker({ currentCover, onChange, onClose }) {
  const handleColorClick = (color) => {
    onChange({ type: 'color', value: color });
  };

  const handleGradientClick = (gradient) => {
    onChange({ type: 'gradient', value: gradient });
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h4>Cover</h4>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.section}>
          <h5>Colors</h5>
          <div className={styles.grid}>
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.swatch} ${
                  currentCover?.type === 'color' && currentCover?.value === color ? styles.selected : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
              />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h5>Gradients</h5>
          <div className={styles.grid}>
            {COVER_GRADIENTS.map((gradient, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.swatch} ${
                  currentCover?.type === 'gradient' && currentCover?.value === gradient ? styles.selected : ''
                }`}
                style={{ background: gradient }}
                onClick={() => handleGradientClick(gradient)}
              />
            ))}
          </div>
        </div>

        {currentCover && (
          <button type="button" className={styles.removeBtn} onClick={handleRemove}>
            Remove cover
          </button>
        )}
      </div>
    </div>
  );
}
