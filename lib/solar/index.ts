/**
 * `lib/solar` — the solar position engine.
 *
 * Pure, framework-free and extractable as a standalone package without edits;
 * Falak depends on exactly this surface (CLAUDE.md invariant 1). Nothing here
 * imports React, Next, the DOM, a clock, or the network.
 */

export * from './angles'
export * from './julian'
export * from './position'
export * from './noon'
export * from './altitude'
