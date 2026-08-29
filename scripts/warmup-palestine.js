/**
 * Palestine Collector Warmup Script
 * 
 * Run this script to manually bypass Cloudflare Turnstile for jobs.ps.
 * It opens a headful Chrome instance, waits for you to solve the challenge,
 * and saves the session to .browser-data for the aggregator to use.
 * 
 * Usage: node scripts/warmup-palestine.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function warmup() {
    const userDataDir = path.join(process.cwd(), '.browser-data');
    
    console.log('---------------------------------------------------------');
    console.log('🚀 PALESTINE COLLECTOR WARMUP');
    console.log('---------------------------------------------------------');
    console.log(`Using data directory: ${userDataDir}`);
    
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    console.log('Launching headful Chrome...');
    
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        channel: 'chrome',
        viewport: { width: 1280, height: 720 },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-extensions',
            '--start-maximized'
        ],
        ignoreDefaultArgs: ['--enable-automation']
    });

    const page = await context.newPage();
    
    console.log('Navigating to jobs.ps...');
    try {
        await page.goto('https://www.jobs.ps/', { waitUntil: 'load', timeout: 60000 });
        
        console.log('\nACTION REQUIRED:');
        console.log('1. If you see a Cloudflare "Verify you are not a bot" box, CLICK IT.');
        console.log('2. Once the actual jobs.ps homepage loads, WAIT for 10 seconds.');
        console.log('3. Close the browser window or press Ctrl+C here when finished.');
        
        // Wait for user to interact
        await page.waitForTimeout(600000); // 10 minutes timeout
        
    } catch (error) {
        console.error('Navigation error:', error.message);
    } finally {
        await context.close();
        console.log('\nSession saved to .browser-data. You can now run the aggregator.');
    }
}

warmup().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
