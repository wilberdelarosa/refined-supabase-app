
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeImageUrl(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed; // Local paths are considered valid for now
  }

  let candidate = trimmed;
  if (candidate.startsWith('//')) candidate = `https:${candidate}`;
  if (candidate.startsWith('www.')) candidate = `https://${candidate}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return trimmed; // Return as-is if not valid URL
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();

  // Known bad hosts
  if (host.includes('amazon.com') || host.includes('amazonaws.com') || host.includes('media-amazon.com')) {
    return null;
  }
  if (host.includes('walmart')) {
    return null;
  }

  return url.toString();
}

async function findBadImages() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, image_url')
        .order('name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Scanning ${products.length} products for bad images...`);
    
    let badCount = 0;
    
    products.forEach(p => {
        const normalized = normalizeImageUrl(p.image_url);
        if (!normalized) {
            console.log(`[BAD IMAGE] ${p.name}`);
            console.log(`  ID: ${p.id}`);
            console.log(`  URL: ${p.image_url}`);
            badCount++;
        }
    });

    if (badCount === 0) {
        console.log('No bad images found based on normalization rules.');
    } else {
        console.log(`\nFound ${badCount} products with invalid/bad images.`);
    }
}

findBadImages();
