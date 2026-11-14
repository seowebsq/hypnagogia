# Dream worlds and creatures

Implement in play.html, following the existing procedural Three.js geometry, voxel palettes and wake loop. Update index.html with the new progression.

- Replace frog sprite with a low-poly 3D frog: feet, belly, throat, luminous spiral irises; keep song hints and gaze effects. Replace moth sprite with a 3D moth: mirrored patterned wings, antennae and animated wingbeats; preserve word theft and return.
- Add three world configurations: Moss Garden, Glass Desert and Moon Marsh. Give each different terrain, palette, sky, landmarks and a visible world label. Moon Marsh has lighter gravity. Keep existing three-door/shard puzzles in each world.
- After all three shards are returned, offer the next world; after world three, show the final wake and replay. Save the current world index alongside existing memories and inventory. Validate saved world indices. Reload restarts the current world's puzzles.
- Centralize new-world generation and clear transient physics, enchantments, vanished blocks, phased island blocks, creature state and delayed platform effects. Preserve the original garden's terrain and visual work. Generate a safe anchor/spawn and three vaults per world.
- Verify with browser assertions for progression, replay, reload, invalid saves, reset state, creature rendering and moth theft/return; inspect screenshots of creatures and each world, plus small viewport. Run git diff --check.

Verification: five Node tests pass; browser checks passed for all world transitions, final replay, saved-world reloads, invalid save indices, frog song hints, moth theft/return, temporary-platform cleanup, and a 640 × 480 viewport. No browser errors. Independent review has no outstanding findings.
