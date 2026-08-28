import anchorPhoto from "@/public/media/anchor.jpg";
import cementPhoto from "@/public/media/cement.jpg";
import epsPhoto from "@/public/media/eps.jpg";
import eticsSectionPhoto from "@/public/media/etics-section.jpg";
import externalWallPhoto from "@/public/media/external-wall.jpg";
import floorPhoto from "@/public/media/floor.jpg";
import internalPartitionPhoto from "@/public/media/internal-partition.jpg";
import meshPhoto from "@/public/media/mesh.jpg";
import mineralWoolPhoto from "@/public/media/mineral-wool.jpg";
import pitchedRoofPhoto from "@/public/media/pitched-roof.jpg";
import renderPhoto from "@/public/media/render.jpg";

/**
 * Material photography. A texture identifies what a product is made of, so
 * every product in a family shares one — the thickness bar and the product code
 * are what separate the variants.
 *
 * Alt text describes what is in the photograph. Where the image is decorative
 * because the same information is already in the text beside it, components
 * pass `alt=""` instead of one of these.
 *
 * Every photograph is imported rather than named by its public path, so the URL
 * that reaches the browser carries a hash of the file's own contents. That is
 * what makes replacing a photograph work: `next.config.ts` caches optimised
 * derivatives for a year, and an address that stays the same while the bytes
 * behind it change leaves the old encode sitting in every browser that has
 * already seen it. A new photograph is a new address, so nothing stale can be
 * served. The files stay in `public/` because the site's Open Graph tag needs
 * one of them at a fixed address a crawler can be handed.
 */

export type Texture = { src: string; alt: string };

const TEXTURES: Record<string, Texture> = {
  "mineral-wool": {
    src: mineralWoolPhoto.src,
    alt: "Macro photograph of mineral wool: fine pale grey-green fibres in a loose tangle.",
  },
  eps: {
    src: epsPhoto.src,
    alt: "Macro photograph of a cut expanded polystyrene board, showing fused white beads.",
  },
  xps: {
    src: floorPhoto.src,
    alt: "Cut edge of a floor build-up: a rigid insulation board between a concrete slab and a screed.",
  },
  "wood-fibre": {
    src: pitchedRoofPhoto.src,
    alt: "Timber rafter with fibre insulation and a folded-back vapour control layer.",
  },
  mesh: {
    src: meshPhoto.src,
    alt: "Macro photograph of alkali-resistant glass fibre reinforcement mesh.",
  },
  cement: {
    src: cementPhoto.src,
    alt: "Trowelled cementitious base coat, showing the ridge left by the trowel edge.",
  },
  render: {
    src: renderPhoto.src,
    alt: "Macro photograph of a floated thin-coat render surface, showing the grain texture.",
  },
  anchor: {
    src: anchorPhoto.src,
    alt: "Plastic insulation anchor with a perforated washer plate and a ribbed shank.",
  },
};

const FALLBACK: Texture = {
  src: cementPhoto.src,
  alt: "Trowelled cementitious surface.",
};

export function texture(key: string): Texture {
  return TEXTURES[key] ?? FALLBACK;
}

const APPLICATION_IMAGES: Record<string, Texture> = {
  "external-wall": {
    src: externalWallPhoto.src,
    alt: "Macro photograph of a cut section through a rendered external wall system, read from the top down: thin-coat render, base coat with the reinforcement mesh surfacing through it, mineral wool, ribbed adhesive mortar and blockwork.",
  },
  "pitched-roof": {
    src: pitchedRoofPhoto.src,
    alt: "Section through a pitched roof: timber rafter, fibre insulation, vapour control layer and board lining.",
  },
  "flat-roof": {
    src: eticsSectionPhoto.src,
    alt: "Section through a warm-deck build-up: structural base, insulation, reinforced coat and a smooth top surface.",
  },
  floor: {
    src: floorPhoto.src,
    alt: "Section through a floor build-up: structural slab, insulation board and screed.",
  },
  "internal-partition": {
    src: internalPartitionPhoto.src,
    alt: "Section through a metal stud partition with board linings and mineral wool cavity insulation.",
  },
};

export function applicationImage(key: string): Texture {
  return APPLICATION_IMAGES[key] ?? FALLBACK;
}

/**
 * Every product in a family shares one photograph, so each card shows a
 * different part of it: a regular grid with irregular tone, the way a real
 * sample wall looks. Derived from the slug, so a product always crops the same.
 */
export function textureCrop(seed: string): React.CSSProperties {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }
  const scale = 1.55 + ((hash >> 3) % 5) * 0.06;
  // The crop has to stay inside the frame, so the offset is bounded by how
  // much the scale actually adds.
  const range = ((scale - 1) / scale / 2) * 100;
  const x = ((hash % 41) / 40 - 0.5) * 2 * range;
  const y = ((Math.floor(hash / 41) % 41) / 40 - 0.5) * 2 * range;
  // Handed over as a custom property rather than as `transform`, so the hover
  // zoom in globals.css can compose with it instead of being overridden.
  return {
    "--crop": `scale(${scale.toFixed(2)}) translate(${x.toFixed(1)}%, ${y.toFixed(1)}%)`,
  } as React.CSSProperties;
}

export const HERO_IMAGE: Texture = {
  src: eticsSectionPhoto.src,
  alt: "A cut sample of an external wall system: blockwork, adhesive, mineral wool, reinforcement mesh and a white render finish, stacked in the order they are installed.",
};
