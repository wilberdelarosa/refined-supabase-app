import { RNCHandler } from 'dgii-rnc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Initializing RNC Handler...');
  // Use a local tmp directory for data to avoid permission issues or polluting user home if preferred, 
  // but let's stick to default for now to leverage caching if run locally by user later.
  // Actually, default is home dir. Let's use project temp to be safe? 
  // The README says: path.join(os.homedir(), '.dgii-rnc', 'DGII_RNC.TXT')
  // That's fine.

  const handler = new RNCHandler();

  console.log('Searching for RNC: 133206692');
  console.log('Note: First run may take time to download the DGII dataset.');
  
  const startTime = Date.now();
  try {
    const results = await handler.search({ ID: '133206692' });
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`Search completed in ${duration.toFixed(2)}s`);
    console.log('Results:', JSON.stringify(results, null, 2));
    
    if (results && results.length > 0) {
        console.log('\n--- EXTRACTED INFO ---');
        console.log('RNC:', results[0].RNC_CEDULA || results[0].ID); // Check field names in output
        console.log('Nombre:', results[0].RAZON_SOCIAL || results[0].NOMBRE);
    } else {
        console.log('No results found.');
    }

  } catch (error) {
    console.error('Error during search:', error);
  }
}

run();
