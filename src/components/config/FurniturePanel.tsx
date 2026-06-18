import { useRef } from 'react';
import { useFurniture } from '../../hooks/useFurniture';
import { useI18n } from '../../i18n';
import styles from './config.module.css';

/**
 * Furniture tab: describe furniture/positions (text), add reference images, or
 * both. All optional — they combine into one staging request.
 */
export function FurniturePanel() {
  const { t } = useI18n();
  const { layout, assets, setLayout, addAssets, removeAsset, setAssetNote } = useFurniture();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className={styles.group}>
        <span className={styles.groupLabel}>{t.config.layoutLabel}</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          placeholder={t.config.layoutPlaceholder}
        />
      </div>

      <div className={styles.group}>
        <div className={styles.promptHead}>
          <span className={styles.groupLabel}>{t.config.assetsLabel}</span>
          <button className={styles.rebuild} onClick={() => fileInput.current?.click()}>
            {t.config.addAsset}
          </button>
        </div>
        <span className={styles.fieldHint}>{t.config.assetsHint}</span>

        {assets.map((a) => (
          <div key={a.id} className={styles.asset}>
            <img className={styles.assetThumb} src={a.dataUrl} alt={a.name} />
            <input
              className={styles.assetNote}
              value={a.note}
              placeholder={t.config.assetNotePlaceholder}
              onChange={(e) => setAssetNote(a.id, e.target.value)}
            />
            <button className={styles.assetRemove} onClick={() => removeAsset(a.id)} title={t.views.remove}>
              ✕
            </button>
          </div>
        ))}

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void addAssets(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </>
  );
}
