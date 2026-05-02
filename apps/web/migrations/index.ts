import * as migration_20260202_221539 from './20260202_221539';
import * as migration_20260211_enable_rls_all_tables from './20260211_enable_rls_all_tables';
import * as migration_20260212_213008_add_guide_fields from './20260212_213008_add_guide_fields';
import * as migration_20260405_add_media_blur_data_url from './20260405_add_media_blur_data_url';
import * as migration_20260412_151100_add_guide_years_experience from './20260412_151100_add_guide_years_experience';
import * as migration_20260419_154101_add_guide_profile_fields from './20260419_154101_add_guide_profile_fields';
import * as migration_20260501_083209_add_tours_cities_relation from './20260501_083209_add_tours_cities_relation';
import * as migration_20260502_181007_add_listing_query_indexes from './20260502_181007_add_listing_query_indexes';

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
    name: '20260212_213008_add_guide_fields',
  },
  {
    up: migration_20260405_add_media_blur_data_url.up,
    down: migration_20260405_add_media_blur_data_url.down,
    name: '20260405_add_media_blur_data_url',
  },
  {
    up: migration_20260412_151100_add_guide_years_experience.up,
    down: migration_20260412_151100_add_guide_years_experience.down,
    name: '20260412_151100_add_guide_years_experience',
  },
  {
    up: migration_20260419_154101_add_guide_profile_fields.up,
    down: migration_20260419_154101_add_guide_profile_fields.down,
    name: '20260419_154101_add_guide_profile_fields',
  },
  {
    up: migration_20260501_083209_add_tours_cities_relation.up,
    down: migration_20260501_083209_add_tours_cities_relation.down,
    name: '20260501_083209_add_tours_cities_relation'
  },
  {
    up: migration_20260502_181007_add_listing_query_indexes.up,
    down: migration_20260502_181007_add_listing_query_indexes.down,
    name: '20260502_181007_add_listing_query_indexes',
  },
];
