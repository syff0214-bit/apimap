import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm, mapUrl } from '../public/distance.js';
test('same point has zero distance', () => assert.equal(distanceKm({lat:37,lon:127}, {lat:37,lon:127}), 0));
test('one degree on equator is approximately 111.195 km', () => assert.ok(Math.abs(distanceKm({lat:0,lon:0}, {lat:0,lon:1}) - 111.195) < 0.001));
test('antipodal distance is finite', () => assert.ok(Math.abs(distanceKm({lat:0,lon:0}, {lat:0,lon:180}) - 20015.114) < 0.001));
test('map link preserves both coordinates', () => {
  const url = new URL(mapUrl({lat:37.5,lon:127}, {lat:35,lon:129}));
  assert.equal(url.origin, 'https://www.openstreetmap.org');
  assert.equal(url.searchParams.get('route'), '37.5,127;35,129');
});
