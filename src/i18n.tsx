import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { StagingErrorKind } from './types';

/**
 * All user-facing copy, per locale. Components read strings via useI18n() —
 * never hardcode UI text. (Numbers/endpoints live in config/constants.ts;
 * visual tokens live in styles/tokens.css.)
 */

export type Locale = 'en' | 'de';
export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'de', label: 'DE' },
];

const en = {
  app: { title: 'Venue Virtual Staging' },
  views: {
    title: 'Views',
    addImages: '+ Add images',
    importSplat: 'Import splat',
    splatLoaded: (name: string) => `Splat: ${name}`,
    dragHint: '…or drag a splat / images here',
    matterportSoon: 'Matterport import — coming soon',
    empty: 'No views yet — capture an angle from the splat.',
    useAsRef: 'Use as reference',
    remove: 'Remove',
  },
  viewer: {
    emptyTitle: 'Import a splat to begin.',
    emptyFormats: '.splat / .ply / .ksplat',
    loadError: 'Could not load this splat file.',
    upAxis: 'Up axis',
  },
  stage: {
    navigate: 'Navigate',
    compare: 'Compare',
    capture: '📷 Capture angle',
    original: 'Original',
    staged: 'Staged',
    starting: 'Starting chain…',
    cancel: 'Cancel',
    retry: 'Retry',
    download: 'Download',
    emptyCompare: 'Capture an angle and press Stage to compare.',
  },
  config: {
    title: 'Configure',
    apiKeyLabel: 'Gemini API key',
    apiKeyPlaceholder: 'Paste your key…',
    apiKeyHint: 'Stored only in this tab, never sent anywhere but Google.',
    modelLabel: 'Model',
    promptLabel: 'Prompt',
    rebuild: 'Rebuild from presets',
    rebuildTitleDirty: 'Rebuild from presets',
    rebuildTitleClean: 'Prompt matches presets',
    promptPlaceholder: 'Describe how to stage this venue…',
    stage: 'Stage',
    staging: 'Staging…',
    updating: 'Updating…',
    restage: 'Restage',
  },
  connectivity: {
    offline: 'Internet lost — staging paused.',
    reconnected: 'Reconnected.',
  },
  errors: {
    offline: 'No internet connection.',
    invalid_key: 'Check your Gemini API key.',
    rate_limited: 'Rate limited — retrying…',
    quota:
      'This image model needs billing enabled (free tier = 0). Enable billing on your Google Cloud project, then retry.',
    timeout: 'The request took too long.',
    empty_result: 'The model returned no image.',
    unknown: 'Something went wrong.',
  } satisfies Record<StagingErrorKind, string>,
  presets: {
    groups: {
      stage: 'Stage',
      seating: 'Seating',
      lighting: 'Lighting',
      decor: 'Decor',
    } as Record<string, string>,
    options: {
      'stage-none': 'None',
      'stage-small': 'Small',
      'stage-large': 'Large',
      'stage-full': 'Full width',
      'seating-none': 'None',
      'seating-theatre': 'Theatre rows',
      'seating-round': 'Round tables',
      'seating-banquet': 'Banquet',
      'seating-cocktail': 'Cocktail',
      'lighting-current': 'Current',
      'lighting-bright': 'Bright',
      'lighting-dramatic': 'Dramatic',
      'lighting-intimate': 'Intimate',
      'decor-none': 'None',
      'decor-wedding': 'Wedding',
      'decor-corporate': 'Corporate',
      'decor-party': 'Party',
      'decor-concert': 'Concert',
    } as Record<string, string>,
  },
};

export type Dict = typeof en;

const de: Dict = {
  app: { title: 'Virtuelles Venue-Staging' },
  views: {
    title: 'Ansichten',
    addImages: '+ Bilder hinzufügen',
    importSplat: 'Splat importieren',
    splatLoaded: (name: string) => `Splat: ${name}`,
    dragHint: '…oder Splat / Bilder hierher ziehen',
    matterportSoon: 'Matterport-Import — in Kürze',
    empty: 'Noch keine Ansichten — erfasse einen Blickwinkel aus dem Splat.',
    useAsRef: 'Als Referenz verwenden',
    remove: 'Entfernen',
  },
  viewer: {
    emptyTitle: 'Importiere einen Splat, um zu beginnen.',
    emptyFormats: '.splat / .ply / .ksplat',
    loadError: 'Diese Splat-Datei konnte nicht geladen werden.',
    upAxis: 'Hochachse',
  },
  stage: {
    navigate: 'Navigieren',
    compare: 'Vergleichen',
    capture: '📷 Blickwinkel erfassen',
    original: 'Original',
    staged: 'Gestaltet',
    starting: 'Verarbeitung startet…',
    cancel: 'Abbrechen',
    retry: 'Erneut versuchen',
    download: 'Herunterladen',
    emptyCompare: 'Erfasse einen Blickwinkel und klicke auf „Gestalten“, um zu vergleichen.',
  },
  config: {
    title: 'Konfigurieren',
    apiKeyLabel: 'Gemini-API-Schlüssel',
    apiKeyPlaceholder: 'Schlüssel einfügen…',
    apiKeyHint: 'Nur in diesem Tab gespeichert, wird ausschließlich an Google gesendet.',
    modelLabel: 'Modell',
    promptLabel: 'Prompt',
    rebuild: 'Aus Vorgaben neu erstellen',
    rebuildTitleDirty: 'Aus Vorgaben neu erstellen',
    rebuildTitleClean: 'Prompt entspricht den Vorgaben',
    promptPlaceholder: 'Beschreibe, wie dieser Raum gestaltet werden soll…',
    stage: 'Gestalten',
    staging: 'Gestalte…',
    updating: 'Aktualisiere…',
    restage: 'Neu gestalten',
  },
  connectivity: {
    offline: 'Internet verloren — Gestaltung pausiert.',
    reconnected: 'Wieder verbunden.',
  },
  errors: {
    offline: 'Keine Internetverbindung.',
    invalid_key: 'Überprüfe deinen Gemini-API-Schlüssel.',
    rate_limited: 'Ratenlimit erreicht — erneuter Versuch…',
    quota:
      'Dieses Bildmodell erfordert eine aktivierte Abrechnung (kostenloses Kontingent = 0). Aktiviere die Abrechnung in deinem Google-Cloud-Projekt und versuche es erneut.',
    timeout: 'Die Anfrage hat zu lange gedauert.',
    empty_result: 'Das Modell hat kein Bild zurückgegeben.',
    unknown: 'Etwas ist schiefgelaufen.',
  },
  presets: {
    groups: {
      stage: 'Bühne',
      seating: 'Bestuhlung',
      lighting: 'Beleuchtung',
      decor: 'Dekor',
    },
    options: {
      'stage-none': 'Keine',
      'stage-small': 'Klein',
      'stage-large': 'Groß',
      'stage-full': 'Volle Breite',
      'seating-none': 'Keine',
      'seating-theatre': 'Reihenbestuhlung',
      'seating-round': 'Runde Tische',
      'seating-banquet': 'Bankett',
      'seating-cocktail': 'Stehtische',
      'lighting-current': 'Aktuell',
      'lighting-bright': 'Hell',
      'lighting-dramatic': 'Dramatisch',
      'lighting-intimate': 'Intim',
      'decor-none': 'Kein',
      'decor-wedding': 'Hochzeit',
      'decor-corporate': 'Firmen',
      'decor-party': 'Party',
      'decor-concert': 'Konzert',
    },
  },
};

const dictionaries: Record<Locale, Dict> = { en, de };

function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de')) {
    return 'de';
  }
  return 'en';
}

interface I18nValue {
  t: Dict;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale());
  const value = useMemo<I18nValue>(() => ({ t: dictionaries[locale], locale, setLocale }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
