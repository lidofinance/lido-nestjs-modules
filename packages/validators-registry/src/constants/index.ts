// 500 — SQLite limit in insert operation
export const NUM_VALIDATORS_MAX_CHUNK = 100;

export const SLOTS_PER_EPOCH = 32;

export const VALIDATORS_REGISTRY_OPTIONS_TOKEN = Symbol(
  'validatorsRegistryOptions',
);

/**
 * How many blocks back to walk when looking for the execution payload that the beacon state already has.
 *
 * The walk follows `parent_root`, so it counts proposed blocks and not slots: missed slots cost nothing. One step is
 * enough unless a builder failed to reveal its payload in time, which is rare and does not last long, so this default
 * leaves a lot of room.
 */
export const VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH = 32;
