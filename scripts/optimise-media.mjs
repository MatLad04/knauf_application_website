/**
 * Re-encodes the source photography in imgs/json/ into public/media/.
 *
 * The originals are ~750 KB each, which next/image would happily serve as an
 * 8 MB page. This pass drops them to a sane base size; next/image then derives
 * the AVIF and WebP widths each layout actually asks for.
 */

import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "imgs", "json");
const target = join(root, "public", "media");

const NAMES = {
  "1_landing_hero.jpg": "etics-section.jpg",
  "2_external_wall.jpg": "external-wall.jpg",
  "3_pitched_roof.jpg": "pitched-roof.jpg",
  "4_floor.jpg": "floor.jpg",
  "5_intenal_partitions.jpg": "internal-partition.jpg",
  "6_mineral_wool.jpg": "mineral-wool.jpg",
  "7_eps_board.jpg": "eps.jpg",
  "8_glass_fibre.jpg": "mesh.jpg",
  "9_cement_base.jpg": "cement.jpg",
  "10_silicone_finish.jpg": "render.jpg",
  "11_plastic_insulation.jpg": "anchor.jpg",
};

mkdirSync(target, { recursive: true });

let saved = 0;
for (const file of readdirSync(source)) {
  const name = NAMES[file];
  if (!name) continue;

  const image = sharp(join(source, file));
  const { size } = await image
    .clone()
    .resize(1024, 1024, { fit: "cover" })
    // Slight desaturation pulls the greener macros back towards the neutral
    // grey the rest of the set sits in, so the sample wall reads as one shoot.
    .modulate({ saturation: 0.82 })
    .jpeg({ quality: 76, progressive: true, mozjpeg: true })
    .toFile(join(target, name));

  saved += size;
  console.log(`${file} → media/${name}  ${(size / 1024).toFixed(0)} KB`);
}
console.log(`total ${(saved / 1024 / 1024).toFixed(1)} MB`);
