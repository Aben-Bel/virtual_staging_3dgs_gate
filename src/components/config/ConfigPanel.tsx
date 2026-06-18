import { useState } from 'react';
import { PRESET_GROUPS } from '../../config/presets';
import { useI18n } from '../../i18n';
import { useApiKey } from '../../hooks/useApiKey';
import { useModel } from '../../hooks/useModel';
import { usePrompt } from '../../hooks/usePrompt';
import type { StagingState } from '../../state/machines/staging';
import { ApiKeyField } from './ApiKeyField';
import { ModelSelector } from './ModelSelector';
import { PresetGroup } from './PresetGroup';
import { PromptBox } from './PromptBox';
import { FurniturePanel } from './FurniturePanel';
import { LangSwitch } from './LangSwitch';
import { ThemeSwitch } from './ThemeSwitch';
import { Button } from '../ui/Button';
import styles from './config.module.css';

type Tab = 'style' | 'furniture';

interface Props {
  staging: StagingState;
  canStage: boolean;
  onSubmit: () => void;
}

/** Right panel container: key, model, presets, prompt, stage action. */
export function ConfigPanel({ staging, canStage, onSubmit }: Props) {
  const { t } = useI18n();
  const { apiKey, setApiKey } = useApiKey();
  const { model, setModel } = useModel();
  const { prompt, promptDirty, selection, selectPreset, editPrompt, rebuildFromPresets } = usePrompt();
  const [tab, setTab] = useState<Tab>('style');

  const busy = staging.status === 'loading' || staging.status === 'debouncing';

  const stageLabel =
    staging.status === 'loading'
      ? t.config.staging
      : staging.status === 'debouncing'
        ? t.config.updating
        : staging.status === 'result'
          ? t.config.restage
          : t.config.stage;

  return (
    <aside className={styles.panel}>
      <header className={styles.head}>
        <span>{t.config.title}</span>
        <div className={styles.headControls}>
          <ThemeSwitch />
          <LangSwitch />
        </div>
      </header>

      <ApiKeyField value={apiKey} onChange={setApiKey} />
      <ModelSelector label={t.config.modelLabel} value={model} onChange={setModel} />

      <div className={styles.tabs}>
        <button
          className={tab === 'style' ? styles.tabActive : styles.tab}
          onClick={() => setTab('style')}
        >
          {t.config.tabStyle}
        </button>
        <button
          className={tab === 'furniture' ? styles.tabActive : styles.tab}
          onClick={() => setTab('furniture')}
        >
          {t.config.tabFurniture}
        </button>
      </div>

      {tab === 'style' ? (
        <>
          {PRESET_GROUPS.map((group) => (
            <PresetGroup
              key={group.id}
              group={group}
              selectedId={selection[group.id]}
              onSelect={selectPreset}
            />
          ))}
          <PromptBox
            value={prompt}
            dirty={promptDirty}
            onChange={editPrompt}
            onRebuild={rebuildFromPresets}
          />
        </>
      ) : (
        <FurniturePanel />
      )}

      <Button
        variant="accent"
        className={styles.stageBtn}
        disabled={!canStage || busy}
        onClick={onSubmit}
      >
        {stageLabel}
      </Button>
    </aside>
  );
}
