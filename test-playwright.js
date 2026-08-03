const PalestineCollector = require('./services/palestineCollector');

async function testPlaywright() {
    console.log('Testing Playwright implementation...\n');
    
    const collector = new PalestineCollector((msg, type) => {
        console.log(`[${type || 'info'}] ${msg}`);
    });
    
    const testSource = {
        name: 'Jobs.ps - Test',
        base_url: 'https://www.jobs.ps/locations/ramallah-jobs',
        config: {
            pages: 1,
            selectors: {
                job_item: 'a.list-3--row',
                title: '.list-3--cell-title-2',
                company: '.list--cell--company',
                location: '.list-3--cell-1 span.tooltip'
            }
        }
    };
    
    try {
        const jobs = await collector.collect(testSource);
        console.log(`\n✅ Test completed successfully!`);
        console.log(`Found ${jobs.length} jobs`);
        
        if (jobs.length > 0) {
            console.log(`\nFirst job sample:`);
            console.log(JSON.stringify(jobs[0], null, 2));
        }
        
        process.exit(0);
    } catch (error) {
        console.error(`\n❌ Test failed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

testPlaywright();
