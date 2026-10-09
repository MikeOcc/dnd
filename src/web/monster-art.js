// THE SEVEN LEVELS — painted artwork for monsters.
//
// A monster listed here is shown as a painting rather than its SVG drawing, in
// both art styles (for now, the great unique monsters). Two kinds:
//   - a whole scene (the Aboleth's): never cut out. In a fight it fills the view
//     as an illustration, its edges fading into the dungeon's dark through a soft
//     vignette (nothing is removed from the art); standing in a 3D view it is
//     drawn with a tighter vignette around the creature.
//   - a cutout (cutout: true), on a transparent background: shown like the
//     drawings, the creature alone over the view, and standing in the 3D views
//     at its own shape.
// Cutouts are made from the artist's PNG: shrunk to web size, the faint
// coloured fringe left by background removal taken off the edge pixels only,
// saved as WebP (which keeps the transparency).
// Until a painting has loaded (or if it fails to), the SVG drawing is used, so
// the layout never shifts and no broken image shows.
//
// To give another monster a painting: put the image in src/web/art/ and add a
// line below.
//   src:   the image, relative to the page
//   focus: the point to keep in view when the illustration is cropped to the
//          view's shape (CSS object-position)
//   scene: the vignette for the 3D views, as fractions of the image (centre and
//          radius): what is kept is the creature, the rest fades to nothing
//   cutout: a transparent cutout (see above); height: its height in a fight, in px
//   soft: a painting on its own background shown like a cutout (the whole
//         figure, not cropped to the view), its edges fading into the dark

'use strict';

const MONSTER_ART = {
  Aboleth: { src: 'art/aboleth.jpg?v=1', focus: '50% 52%', scene: { cx: 0.6, cy: 0.52, r: 0.42 } },
  'Bone Sovereign': { src: 'art/bone-sovereign.webp?v=1', cutout: true, height: 330 },
  Rakshasa: { src: 'art/rakshasa.webp?v=1', cutout: true, height: 320 },
  'Barrow-King': { src: 'art/barrow-king.webp?v=1', cutout: true, height: 340 },
  'Lambton Worm': { src: 'art/lambton-worm.webp?v=1', cutout: true, height: 270 },
  'Gloommaw': { src: 'art/nightwalker.webp?v=1', cutout: true, height: 350 },
  'Orc King': { src: 'art/orc-king.webp?v=1', cutout: true, height: 330 },
  Tarrasque: { src: 'art/tarrasque.webp?v=1', cutout: true, height: 280 },
  'Big Fat Dragon': { src: 'art/tiamat.webp?v=1', cutout: true, height: 320 },
  // Asmodeus, the reptilian lord, on the red smoke of his own background.
  Asmodeus: { src: 'art/asmodeus.jpg?v=1', soft: true, height: 380, scene: { cx: 0.5, cy: 0.5, r: 0.5 } },
};

const paintedArtState = {};   // type -> { img, status: 'loading' | 'ok' | 'failed', scene?: canvas }

/** The painting for a monster type, or null. */
function paintedArt(type) {
  return MONSTER_ART[type] || null;
}

/** Starts loading a painting (once); `onReady` runs when it arrives. */
function loadPaintedArt(type, onReady) {
  const art = paintedArt(type);
  if (!art) return null;
  let st = paintedArtState[type];
  if (!st) {
    const img = new Image();
    img.decoding = 'async';
    st = paintedArtState[type] = { img, status: 'loading', waiting: [] };
    img.onload = () => { st.status = 'ok'; st.waiting.splice(0).forEach(fn => fn()); };
    img.onerror = () => { st.status = 'failed'; st.waiting.splice(0).forEach(fn => fn()); };
    img.src = art.src;
  }
  if (onReady && st.status === 'loading') st.waiting.push(onReady);
  return st;
}

/** Whether a monster's painting is ready to show. */
function paintedArtReady(type) {
  return paintedArtState[type]?.status === 'ok';
}

/** The painting with the 3D views' vignette: the creature, fading to
 * transparent around it (a canvas, made once). */
function paintedSceneImage(type) {
  const art = paintedArt(type), st = paintedArtState[type];
  if (!art || !st || st.status !== 'ok') return null;
  if (art.cutout) return st.img;   // already the creature alone
  if (st.scene) return st.scene;
  const { cx, cy, r } = art.scene;
  // Crop around the creature (keeping the painting's proportions), then fade its edges away.
  const sw = st.img.naturalWidth * r * 2, sh = st.img.naturalHeight * r * 2;
  const size = 512;
  const c = document.createElement('canvas');
  c.width = Math.round(size * Math.min(1, sw / sh));
  c.height = Math.round(size * Math.min(1, sh / sw));
  const g = c.getContext('2d');
  g.drawImage(st.img, st.img.naturalWidth * cx - sw / 2, st.img.naturalHeight * cy - sh / 2, sw, sh, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  g.save();
  g.translate(c.width / 2, c.height / 2);
  g.scale(c.width / 2, c.height / 2);   // an ellipse filling the crop
  const fade = g.createRadialGradient(0, 0, 0.44, 0, 0, 1);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.55, 'rgba(0,0,0,0.85)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fade;
  g.fillRect(-1, -1, 2, 2);
  g.restore();
  return (st.scene = c);
}
