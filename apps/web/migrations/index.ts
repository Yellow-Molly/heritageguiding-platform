import * as migration_20260202_221539 from './20260202_221539';
import * as migration_20260211_enable_rls from './20260211_enable_rls_all_tables';

export const migrations = [
  {
    up: migration_20260202_221539.up,
    down: migration_20260202_221539.down,
    name: '20260202_221539'
  },
  {
    up: migration_20260211_enable_rls.up,
    down: migration_20260211_enable_rls.down,
    name: '20260211_enable_rls_all_tables',
  },
];
