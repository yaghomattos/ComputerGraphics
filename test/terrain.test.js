import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHeightMap } from '../terrain.js';

/* Two triangles forming a horizontal rectangle at height z. */
function rectangle(x0, y0, x1, y1, z) {
  return [x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z];
}

test('the height map keeps the highest surface over each point', () => {
  const ground = rectangle(0, 0, 100, 100, 5);
  const roof = rectangle(40, 40, 60, 60, 30);
  const map = createHeightMap([...ground, ...roof], 2);

  assert.equal(map.heightAt(10, 10), 5);
  assert.equal(map.heightAt(50, 50), 30);
  assert.equal(map.heightAt(200, 200), -Infinity);
});

test('heights are interpolated on sloped triangles', () => {
  const ramp = [0, 0, 0, 100, 0, 100, 0, 100, 0];
  const map = createHeightMap(ramp, 1);
  const h = map.heightAt(49.5, 10);
  assert.ok(h >= 49 && h <= 51.5, `height ${h}`);
});

test('vertical walls do not add area', () => {
  const wall = [0, 0, 0, 10, 0, 0, 10, 0, 50];
  const ground = rectangle(0, -10, 10, 10, 0);
  const map = createHeightMap([...ground, ...wall], 1);
  assert.ok(map.heightAt(5, 5) <= 0);
});
