
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
// Using the same anon key as in the previous script for simplicity, though typically should use env var
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductImage() {
    const productName = "CELL TECH CREATINA 6 LB"; 

    console.log(`Checking product: "${productName}"...`);

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productName}%`);

    if (error) {
        console.error('Error fetching product:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No product found with that name.');
        return;
    }

    const product = products[0];
    console.log('Found product:', product.name);
    console.log('ID:', product.id);
    console.log('Image URL in DB:', product.image_url);

    if (product.image_url) {
        // Simple normalization check logic to mimic src/lib/image-url.ts locally
        console.log('\n--- Normalization Logic Check ---');
        const url = product.image_url.trim();
        let candidate = url;
        if (candidate.startsWith('//')) candidate = `https:${candidate}`;
        if (candidate.startsWith('www.')) candidate = `https://${candidate}`;
        
        try {
            const parsedUrl = new URL(candidate);
            const host = parsedUrl.hostname.toLowerCase();
            console.log('Host:', host);
            console.log('Protocol:', parsedUrl.protocol);

            if (host.includes('amazon.com') || host.includes('amazonaws.com') || host.includes('media-amazon.com')) {
                console.log('Result: REJECTED (Amazon)');
            } else if (host.includes('walmart')) {
                 console.log('Result: REJECTED (Walmart)');
            } else {
                 console.log('Result: ACCEPTED (by filters)');
            }
        } catch (e) {
            console.log('Result: REJECTED (Invalid URL)', e.message);
        }
    } else {
        console.log('Product has no image_url set.');
    }
}

checkProductImage();
