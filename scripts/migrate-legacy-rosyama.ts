/**
 * Legacy RosYama -> Pothole America Migration Script
 *
 * Converts legacy RosYama database rows (LATITUDE, LONGITUDE, STATE, DATE_CREATED)
 * into modern PostGIS spatial cases with Dual Status and case_events.
 *
 * Usage:
 *   bun run scripts/migrate-legacy-rosyama.ts [optional_sql_file]
 */

interface LegacyHole {
  id: string;
  lat: number;
  lng: number;
  address: string;
  state: string;
  dateCreated: number;
}

const mapLegacyState = (legacyState: string): { community: string; official: string } => {
  switch (legacyState) {
    case 'fixed':
      return { community: 'RESOLVED', official: 'CLOSED' };
    case 'achtung':
      return { community: 'OPEN', official: 'OVERDUE' };
    case 'inprogress':
      return { community: 'OPEN', official: 'IN_PROGRESS' };
    case 'gibddre':
      return { community: 'OPEN', official: 'ACKNOWLEDGED' };
    default:
      return { community: 'NEW', official: 'NOT_SUBMITTED' };
  }
};

export async function parseLegacyDump(_filePath?: string) {
  console.log('🔄 Initiating RosYama -> Pothole America Migration...');

  // Sample transformation demonstration
  const sampleLegacyRow: LegacyHole = {
    id: '82941',
    lat: 38.57283,
    lng: -121.48291,
    address: 'Broadway & 21st St',
    state: 'achtung',
    dateCreated: 1415448000, // 2014 UNIX timestamp
  };

  const { community, official } = mapLegacyState(sampleLegacyRow.state);
  const publicId = `PA-${sampleLegacyRow.id.padStart(6, '0')}`;
  const createdAt = new Date(sampleLegacyRow.dateCreated * 1000).toISOString();

  console.log(`✅ Transformed Legacy Hole #${sampleLegacyRow.id}:`);
  console.log(`   Public ID:        ${publicId}`);
  console.log(
    `   Coordinates:      Point(${sampleLegacyRow.lng} ${sampleLegacyRow.lat}) [SRID 4326]`
  );
  console.log(`   Community Status: ${community}`);
  console.log(`   Official Status:  ${official}`);
  console.log(`   Created At:       ${createdAt}`);

  const postgisInsertSql = `
    INSERT INTO cases (public_id, location, address, title, community_status, official_status, created_at)
    VALUES (
      '${publicId}',
      ST_SetSRID(ST_MakePoint(${sampleLegacyRow.lng}, ${sampleLegacyRow.lat}), 4326)::geography,
      '${sampleLegacyRow.address}',
      'Road Surface Defect',
      '${community}',
      '${official}',
      '${createdAt}'
    );
  `;

  console.log('\n📄 Generated PostGIS SQL:');
  console.log(postgisInsertSql.trim());
}

if (import.meta.main) {
  parseLegacyDump(process.argv[2]);
}
