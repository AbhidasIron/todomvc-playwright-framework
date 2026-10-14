import { test as bddBase } from 'playwright-bdd';
import { fixtures } from '../../../src/fixtures/test-fixtures.js';

/** Same fixtures as the spec tests, built on playwright-bdd's `test` as createBdd() requires. */
export const test = bddBase.extend(fixtures);
