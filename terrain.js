/**
 * Height map of a triangle mesh seen from above (Z up): for each cell of a regular grid, the
 * highest point of the mesh over the cell center. Used to know what is below the airplane
 * (ground, street or building top) without ray casting against the whole city every frame.
 */

/**
 * positions: flat array of world-space triangle vertices [x0, y0, z0, x1, y1, z1, ...],
 * three vertices per triangle.
 */
export function createHeightMap(positions, cellSize = 4) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    maxY = Math.max(maxY, positions[i + 1]);
  }
  const cols = Math.floor((maxX - minX) / cellSize) + 1;
  const rows = Math.floor((maxY - minY) / cellSize) + 1;
  const heights = new Float32Array(cols * rows).fill(-Infinity);

  for (let t = 0; t < positions.length; t += 9) {
    rasterizeTriangle(positions, t, minX, minY, cellSize, cols, rows, heights);
  }

  /* Highest point among the 4 cells around (x, y), or -Infinity outside the mesh. */
  function heightAt(x, y) {
    const i = Math.floor((x - minX) / cellSize);
    const j = Math.floor((y - minY) / cellSize);
    let height = -Infinity;
    for (let jj = Math.max(0, j); jj <= Math.min(rows - 1, j + 1); jj++) {
      for (let ii = Math.max(0, i); ii <= Math.min(cols - 1, i + 1); ii++) {
        height = Math.max(height, heights[jj * cols + ii]);
      }
    }
    return height;
  }

  return { heightAt, cols, rows };
}

/* Writes the triangle height at every cell center it covers, keeping the highest value. */
function rasterizeTriangle(p, t, minX, minY, cellSize, cols, rows, heights) {
  const ax = p[t], ay = p[t + 1], az = p[t + 2];
  const bx = p[t + 3], by = p[t + 4], bz = p[t + 5];
  const cx = p[t + 6], cy = p[t + 7], cz = p[t + 8];

  const area = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  if (Math.abs(area) < 1e-9) return; // vertical wall: seen from above it has no area

  const i0 = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - minX) / cellSize));
  const i1 = Math.min(cols - 1, Math.floor((Math.max(ax, bx, cx) - minX) / cellSize));
  const j0 = Math.max(0, Math.ceil((Math.min(ay, by, cy) - minY) / cellSize));
  const j1 = Math.min(rows - 1, Math.floor((Math.max(ay, by, cy) - minY) / cellSize));

  for (let j = j0; j <= j1; j++) {
    const y = minY + j * cellSize;
    for (let i = i0; i <= i1; i++) {
      const x = minX + i * cellSize;
      // barycentric coordinates of the cell center
      const wa = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / area;
      const wb = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / area;
      const wc = 1 - wa - wb;
      if (wa < -1e-6 || wb < -1e-6 || wc < -1e-6) continue;
      const z = wa * az + wb * bz + wc * cz;
      const cell = j * cols + i;
      if (z > heights[cell]) heights[cell] = z;
    }
  }
}
