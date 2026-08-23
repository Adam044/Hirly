
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const assets = [
    { name: 'logo.jpg', url: 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/logo.jpg' },
    { name: 'palestine-flag.svg', url: 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/palestine-flag.svg' },
    { name: 'united-kingdom-flag.svg', url: 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/united-kingdom-flag.svg' },
    { name: 'about22.jpg', url: 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/about22.jpg' },
    { name: 'hero-bg.jpg', url: 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/hero-bg.jpg' }
];

async function downloadAssets() {
    const assetsDir = path.join(__dirname, '../public/assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    for (const asset of assets) {
        try {
            console.log(`Downloading ${asset.name}...`);
            const response = await axios({
                method: 'GET',
                url: asset.url,
                responseType: 'stream'
            });
            const writer = fs.createWriteStream(path.join(assetsDir, asset.name));
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`Successfully downloaded ${asset.name}`);
        } catch (error) {
            console.error(`Failed to download ${asset.name}:`, error.message);
        }
    }
}

downloadAssets();
