
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductImages() {
    const productId = '2e653162-d8db-41c5-90e5-bb97cfd1f31a'; // CELL TECH CREATINA 6 LB
    
    console.log(`Checking images for product ID: ${productId}`);

    const { data: images, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId);

    if (error) {
        console.error('Error fetching product images:', error);
        return;
    }

    console.log('Product Images found:', images.length);
    if (images.length > 0) {
        images.forEach(img => {
            console.log(`- ID: ${img.id}, URL: ${img.url}`);
        });
    } else {
        console.log('No entries in product_images table.');
    }
}

checkProductImages();
