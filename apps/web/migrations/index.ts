import * as migration_20260202_221539 from './20260202_221539';
import * as migration_20260211_enable_rls_all_tables from './20260211_enable_rls_all_tables';
import * as migration_20260212_213008_add_guide_fields from './20260212_213008_add_guide_fields';

export const migrations = [
  {
    up: migration_20260202_221539.up,
    down: migration_20260202_221539.down,
    name: '20260202_221539',
  },
  {
    up: migration_20260211_enable_rls_all_tables.up,
    down: migration_20260211_enable_rls_all_tables.down,
    name: '20260211_enable_rls_all_tables',
  },
  {
    up: migration_20260212_213008_add_guide_fields.up,
    down: migration_20260212_213008_add_guide_fields.down,
    name: '20260212_213008_add_guide_fields'
  },
];
