
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMissingImages() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, image_url')
        .order('name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('Checking for products with missing or invalid images...');
    
    const missing = products.filter(p => !p.image_url || p.image_url.trim() === '');
    
    if (missing.length === 0) {
        console.log('All products have images!');
    } else {
        console.log(`Found ${missing.length} products without images:`);
        missing.forEach(p => {
            console.log(`- [${p.id}] ${p.name} (${p.category})`);
        });
    }
}

findMissingImages();
