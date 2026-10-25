const YOUTUBE_EMBED_URL =
  'https://www.youtube-nocookie.com/embed/7s8Kn6BDPUc?autoplay=1&mute=1&controls=0&loop=1&playlist=7s8Kn6BDPUc&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&modestbranding=1&cc_load_policy=0';

interface VideoBackgroundProps {
  opacity?: number;
}

/**
 * Fond vidéo immersif YouTube avec boucle automatique, silencieux,
 * et calque transparent de contraste pour préserver la lisibilité de l'interface.
 */
export function VideoBackground({ opacity = 0.72 }: VideoBackgroundProps) {
  return (
    <>
      {/* 1. IFrame Vidéo 16:9 couvrant l'écran */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <iframe
          src={YOUTUBE_EMBED_URL}
          title="Fond vidéo Advanced Civilization"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100vh',
            minWidth: '177.78vh',
            transform: 'translate(-50%, -50%) scale(1.3)',
            border: 'none',
            pointerEvents: 'none',
            opacity,
            filter: 'brightness(0.85) contrast(1.1)',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          tabIndex={-1}
        />
      </div>

      {/* 2. Calque transparent sombre par-dessus la vidéo, sous les boutons */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(ellipse at center, rgba(14, 10, 7, 0.6) 0%, rgba(6, 4, 3, 0.88) 100%)',
          backdropFilter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
