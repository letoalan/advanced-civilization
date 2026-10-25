const LOCAL_VIDEO_URL = '/medias/video/Merveilles%20du%20Monde%20Antique.mp4';

interface VideoBackgroundProps {
  opacity?: number;
}

/**
 * Fond vidéo immersif local (Merveilles du Monde Antique) avec boucle automatique,
 * silencieux, et calque transparent de contraste pour préserver la lisibilité de l'interface.
 */
export function VideoBackground({ opacity = 0.72 }: VideoBackgroundProps) {
  return (
    <>
      {/* 1. Lecteur vidéo HTML5 local couvrant l'ensemble de l'écran */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <video
          src={LOCAL_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controls={false}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            opacity,
            filter: 'brightness(0.85) contrast(1.1)',
          }}
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
