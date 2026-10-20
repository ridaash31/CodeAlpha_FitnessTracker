import { strict as assert } from 'node:assert';
import { addDays, sampleEntries, toDateKey, totalForDate, validateForm, weekSeries } from './utils.ts';

const today = new Date(2026, 9, 20); // 20 Oct 2026
assert.equal(toDateKey(today), '2026-10-20');
assert.equal(toDateKey(addDays(today, -6)), '2026-10-14');
assert.equal(toDateKey(addDays(new Date(2026, 0, 1), -1)), '2025-12-31'); // year boundary

const entries = sampleEntries(today);
assert.equal(totalForDate(entries, '2026-10-20', 'calories'), 380);
assert.equal(totalForDate(entries, '2026-10-20', 'minutes'), 35);
assert.equal(totalForDate(entries, '2026-10-19', 'steps'), 0);

const week = weekSeries(entries, today, 'calories');
assert.equal(week.length, 7);
assert.equal(week[0].key, '2026-10-14');
assert.equal(week[6].key, '2026-10-20');
assert.equal(week.reduce((s, d) => s + d.value, 0), 180 + 320 + 280 + 240 + 350 + 120 + 380);

assert.deepEqual(validateForm({ minutes: '30', calories: '250', steps: '' }), { ok: true, minutes: 30, calories: 250, steps: 0 });
assert.equal(validateForm({ minutes: '', calories: '', steps: '' }).ok, false);
assert.equal(validateForm({ minutes: 'abc', calories: '1', steps: '' }).ok, false);
assert.equal(validateForm({ minutes: '-5', calories: '1', steps: '' }).ok, false);
assert.equal(validateForm({ minutes: '2.5', calories: '1', steps: '' }).ok, false);
assert.equal(validateForm({ minutes: '1441', calories: '', steps: '' }).ok, false);
assert.equal(validateForm({ minutes: '10', calories: '10001', steps: '' }).ok, false);
console.log('All utils tests passed');
