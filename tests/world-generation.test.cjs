const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '..', 'play.html'), 'utf8');
const terrain = html.slice(html.indexOf('// ---------- dream worlds ----------'), html.indexOf('// ---------- notes ----------'));
const surface = html.match(/function surfaceY\(x, z\) \{[^\n]+\}/)[0];
const vaults = html.slice(html.indexOf('function buildVault('), html.indexOf('function inVault('));

function generate(saved) {
  const context = vm.createContext({ localStorage: { hypnagogia: saved } });
  vm.runInContext(terrain + '\n' + surface + '\nlet shards = 0; const doors = [];\n' + vaults + `
    spawnVaults(); spawnLandmarks();
    globalThis.generated = { worldIndex, vox, AX, AZ, get anchorY() { return anchorY; }, get, colHeight, doors, genColumn,
      regenerate(newSeed) {
        seed = newSeed; vox.fill(0); anchorY = colHeight(AX, AZ);
        for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) genColumn(x, z);
        vox[idx(AX, anchorY, AZ)] = 4;
        doors.length = 0; spawnVaults(); spawnLandmarks();
      }
    };`, context);
  return context.generated;
}

test('saved world indices are validated and old or damaged saves start in the garden', () => {
  for (const value of [undefined, '{', 'null', '{}', '{"worldIndex":-1}', '{"worldIndex":3}', '{"worldIndex":"1"}', '{"worldIndex":0.5}']) {
    assert.equal(generate(value).worldIndex, 0, String(value));
  }
  for (const index of [0, 1, 2]) assert.equal(generate(JSON.stringify({ worldIndex: index })).worldIndex, index);
});

for (const index of [0, 1, 2]) {
  test(`world ${index + 1} has safe arrivals, three intact vaults and its own landmarks across terrain seeds`, () => {
    const game = generate(JSON.stringify({ worldIndex: index }));
    for (const seed of [0, 37.7, 101.3, 274.6, 411.9, 999]) {
      game.regenerate(seed);
      assert.equal(game.get(20, game.anchorY, 20), 4);
      for (let x = 19; x <= 21; x++) for (let z = 21; z <= 23; z++) {
        assert.ok(game.get(x, game.anchorY - 1, z), 'arrival must have solid ground');
        for (let y = game.anchorY; y < game.anchorY + 4; y++) assert.equal(game.get(x, y, z), 0, 'arrival must have headroom');
      }
      assert.equal(game.doors.length, 3);
      for (const door of game.doors) {
        assert.ok(!(door.cx > 20 && door.cz > 20), 'vault must leave the dream island clear');
        assert.equal(game.get(door.cx, Math.floor(door.seal[0] / 1600), door.cz), 11, 'vault must retain its shard');
        for (const seal of door.seal) assert.equal(game.vox[seal], 12);
      }
      for (let x = 0; x < 40; x++) for (let z = 0; z < 40; z++) {
        assert.ok(game.colHeight(x, z) >= 2 && game.colHeight(x, z) <= 11, 'terrain must leave room for vault roofs and dream stairs');
      }
      if (index === 1) assert.ok(game.vox.includes(15), 'glass desert must contain crystal spires');
      if (index === 2) assert.ok(game.vox.includes(16) && game.vox.includes(17), 'moon marsh must contain mushroom caps and stems');
    }
  });
}

test('ordinary waking removes temporary platforms even when their columns do not reroll', () => {
  const wake = html.slice(html.indexOf('function wake() {'), html.indexOf('// ---------- loop ----------'));
  const vox = new Uint8Array(40 * 24 * 40);
  const platform = 20 + 40 * (20 + 40 * 10); // protected anchor column
  vox[platform] = 9;
  vox[100] = 9;
  vox[101] = 3;
  const noop = () => {};
  const context = vm.createContext({
    Math: Object.assign(Object.create(Math), { random: () => 1 }),
    vox, worldRevision: 0, seed: 0, anchorY: 5,
    SX: 40, SZ: 40, AX: 20, AZ: 20,
    idx: (x, y, z) => x + 40 * (z + 40 * y),
    player: { pos: { x: 1, z: 1, set: noop }, vel: { set: noop } },
    vanishedBlocks: new Map(), echoAway: 0, echoAnnounced: false,
    stats: { wakes: 0 }, WORDS: [], words: {}, lucidity: 0,
    flash: { style: {} }, requestAnimationFrame: noop,
    inVault: () => false,
    genColumn: () => assert.fail('this wake must not reroll terrain'),
    stampBuild: noop, stampScar: noop, placeWordBlocks: noop, spawnIsland: noop,
    rollUnstable: noop, rollRegions: noop, placeFrog: noop, drawFruitSky: noop,
    persist: noop, rebuild: noop,
  });
  vm.runInContext(wake + '\nwake();', context);
  assert.equal(context.worldRevision, 1, 'stale platform timers must be invalidated');
  assert.equal(vox[platform], 0, 'protected-column platform must be removed');
  assert.equal(vox[100], 0, 'other surviving-column platforms must be removed');
  assert.equal(vox[101], 3, 'ordinary terrain must remain intact');
});
