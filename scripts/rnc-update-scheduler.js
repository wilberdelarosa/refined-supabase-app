import { scheduleUpdates, RNCHandler } from 'dgii-rnc';

console.log('Starting DGII RNC Auto-Updater...');

// Initialize handler (optional, scheduleUpdates creates one if not provided)
const handler = new RNCHandler();

// Schedule updates once every 7 days (in milliseconds)
// 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

console.log(`Scheduling updates every ${ONE_WEEK_MS} ms (1 week).`);
console.log('Press Ctrl+C to stop this process.');

// Perform an immediate check on startup
handler.checkFile().then(() => {
    console.log('Initial check completed.');
}).catch(console.error);

// Start the scheduler
scheduleUpdates({
    handler,
    intervalMs: ONE_WEEK_MS
});
