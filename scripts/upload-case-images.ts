import { supabaseServer } from '../src/lib/supabase/server';

const fallbackImages: Record<string, string> = {
  'PA-001824':
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80', // Deep pothole at intersection
  'PA-001825':
    'https://images.unsplash.com/photo-1765405016829-0e676763ee2f?auto=format&fit=crop&w=1200&q=80', // Crumbling asphalt along lane
  'PA-001826':
    'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?auto=format&fit=crop&w=1200&q=80', // Fixed repaved patch
  'PA-001827':
    'https://images.unsplash.com/photo-1783853414695-aea3b7573bcf?auto=format&fit=crop&w=1200&q=80', // Sunken utility trench
  'PA-001828':
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80', // Rim damage crater
  'PA-001829':
    'https://images.unsplash.com/photo-1635068741358-ab1b9813623f?auto=format&fit=crop&w=1200&q=80', // Highway ramp crater
  'PA-001830':
    'https://images.unsplash.com/photo-1647125849914-5238985ab21a?auto=format&fit=crop&w=1200&q=80', // Subsurface washout / sinkhole
  'PA-001831':
    'https://images.unsplash.com/photo-1741996951192-f4762170f3cb?auto=format&fit=crop&w=1200&q=80', // Alligator cracking
  'PA-001832':
    'https://images.unsplash.com/photo-1783615312378-e21359822ed1?auto=format&fit=crop&w=1200&q=80', // Manhole / storm drain casting
  'PA-001833':
    'https://images.unsplash.com/photo-1769451868259-b3a1c70c80cf?auto=format&fit=crop&w=1200&q=80', // Crosswalk road crater
  'PA-001834':
    'https://images.unsplash.com/photo-1741996950906-5faf36413669?auto=format&fit=crop&w=1200&q=80', // Cul-de-sac asphalt breakdown
  'PA-001835':
    'https://images.unsplash.com/photo-1595734939818-f4e0d44957df?auto=format&fit=crop&w=1200&q=80', // Repaved road paving
};

const casesQuery = await supabaseServer
  .from('cases')
  .select('id, public_id, photo_url')
  .order('public_id');

if (casesQuery.error || !casesQuery.data) {
  console.error('Failed to query cases:', casesQuery.error);
  process.exit(1);
}

const cases = casesQuery.data;
console.log(`Found ${cases.length} cases to process.`);

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://blzsyikioefpnigzagxn.supabase.co';
const BUCKET_NAME = 'case-media';

for (const c of cases) {
  const publicId = c.public_id;
  const storagePath = `hazards/${publicId}.jpg`;
  const expectedUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;

  const sourceUrl = fallbackImages[publicId];
  if (!sourceUrl) continue;

  console.log(`Uploading respective hazard image for ${publicId} from ${sourceUrl}...`);
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.error(`Failed to download image for ${publicId}: ${response.statusText}`);
      continue;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload error for ${publicId}:`, uploadError);
      continue;
    }

    // Update case photo_url
    const { error: updateCaseError } = await supabaseServer
      .from('cases')
      .update({ photo_url: expectedUrl })
      .eq('id', c.id);

    if (updateCaseError) {
      console.error(`Error updating case ${publicId}:`, updateCaseError);
    } else {
      console.log(`✓ ${publicId} successfully stored in Supabase S3 storage -> ${expectedUrl}`);
    }

    // Upsert case_media table
    await supabaseServer.from('case_media').insert({
      case_id: c.id,
      storage_path: storagePath,
      media_type: 'IMAGE',
      is_primary: true,
    });
  } catch (err) {
    console.error(`Unexpected error for ${publicId}:`, err);
  }
}

console.log('All hazard images verified in Supabase S3 storage!');
