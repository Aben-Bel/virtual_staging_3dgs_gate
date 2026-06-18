import { useRef } from 'react';
import { useViews } from '../../hooks/useViews';
import { useI18n } from '../../i18n';
import { ViewThumbnails } from './ViewThumbnails';
import styles from './views.module.css';

/** Left panel container: imports + captured view gallery. */
export function ViewsPanel() {
  const {
    splat,
    views,
    activeViewId,
    importSplat,
    addReferenceImages,
    removeView,
    setActiveView,
    setRefView,
  } = useViews();

  const { t } = useI18n();
  const splatInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const splatFile = files.find((f) => /\.(splat|ply|ksplat)$/i.test(f.name));
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (splatFile) importSplat(splatFile);
    if (images.length) void addReferenceImages(images);
  };

  return (
    <aside
      className={styles.panel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <header className={styles.head}>
        <span className={styles.title}>{t.views.title}</span>
        <button className={styles.addBtn} onClick={() => imageInput.current?.click()}>
          {t.views.addImages}
        </button>
      </header>

      <button className={styles.importBtn} onClick={() => splatInput.current?.click()}>
        {splat ? t.views.splatLoaded(splat.name) : t.views.importSplat}
      </button>
      <p className={styles.hintTiny}>{t.views.dragHint}</p>
      <p className={styles.hintTiny}>{t.views.matterportSoon}</p>

      <ViewThumbnails
        views={views}
        activeViewId={activeViewId}
        onSelect={setActiveView}
        onRemove={removeView}
        onSetRef={setRefView}
      />

      <input
        ref={splatInput}
        type="file"
        accept=".splat,.ply,.ksplat"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importSplat(f);
          e.target.value = '';
        }}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void addReferenceImages(e.target.files);
          e.target.value = '';
        }}
      />
    </aside>
  );
}
