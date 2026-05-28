import { strict as assert } from "node:assert";
import { MemoryDreamScheduler } from "./memory-dream-scheduler.js";

function test(name: string, fn: () => Promise<void> | void) {
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`✓ ${name}`))
    .catch((error) => {
      console.error(`✗ ${name}`);
      console.error(error);
      process.exitCode = 1;
    });
}

test("MemoryDreamScheduler skips repeated ticks inside min interval", async () => {
  let now = 1_000_000;
  const scheduler = new MemoryDreamScheduler({
    enabled: true,
    intervalMs: 60_000,
    minIntervalMs: 10_000,
    days: 7,
    userId: "scheduler-test-empty",
    now: () => now,
  });

  const first = await scheduler.tick();
  const second = await scheduler.tick();

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(scheduler.getState().lastRunAt, 1_000_000);

  now += 10_001;
  const third = await scheduler.tick();
  assert.equal(third, true);
  assert.equal(scheduler.getState().lastRunAt, 1_010_001);
});

test("MemoryDreamScheduler stays idle when disabled", async () => {
  const scheduler = new MemoryDreamScheduler({
    enabled: false,
    intervalMs: 60_000,
    minIntervalMs: 10_000,
    days: 7,
    userId: "scheduler-test-disabled",
  });

  const ran = await scheduler.tick();
  assert.equal(ran, false);
  assert.equal(scheduler.getState().lastRunAt, null);
});
