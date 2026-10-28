import { useTranslation, type SupportedLanguage } from './index.js';

interface LanguageOption {
  code: SupportedLanguage;
  flag: string;
  name: string;
  shortLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', flag: '🇫🇷', name: 'Français', shortLabel: 'FR' },
  { code: 'en', flag: '🇬🇧', name: 'English', shortLabel: 'EN' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', shortLabel: 'DE' },
  { code: 'es', flag: '🇪🇸', name: 'Español', shortLabel: 'ES' },
];

interface LanguageSelectorProps {
  compact?: boolean;
  style?: React.CSSProperties;
}

export function LanguageSelector({ compact = false, style }: LanguageSelectorProps) {
  const { lang, setLanguage } = useTranslation();

  return (
    <div
      role="group"
      aria-label="Sélection de la langue"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 3 : 6,
        padding: compact ? '2px 4px' : '4px 6px',
        background: 'rgba(15, 20, 28, 0.82)',
        border: '1px solid var(--civ-gold-border-subtle)',
        borderRadius: 8,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        ...style,
      }}
    >
      {LANGUAGES.map((item) => {
        const isActive = lang === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            title={item.name}
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: compact ? 3 : 5,
              padding: compact ? '2px 5px' : '4px 8px',
              fontSize: compact ? 11 : 12,
              fontWeight: isActive ? 800 : 500,
              fontFamily: 'var(--civ-font-display)',
              borderRadius: 6,
              border: isActive ? '1px solid var(--civ-gold-base)' : '1px solid transparent',
              background: isActive
                ? 'linear-gradient(180deg, rgba(212,175,55,0.28) 0%, rgba(184,134,11,0.18) 100%)'
                : 'transparent',
              color: isActive ? '#ffd23f' : 'var(--civ-stone-muted)',
              textShadow: isActive ? '0 0 6px rgba(255,210,63,0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {!compact && <span className="lang-flag" style={{ fontSize: 13 }}>{item.flag}</span>}
            {compact ? (
              <span>{item.shortLabel}</span>
            ) : (
              <>
                <span className="lang-label-full">{item.name}</span>
                <span className="lang-label-short">{item.shortLabel}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
