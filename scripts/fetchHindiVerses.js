import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://raw.githubusercontent.com/praneshp1org/Bhagavad-Gita-JSON-data/main/translation.json';
const outputPath = path.join(__dirname, '../src/data/hindiVerses.json');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            // Strip BOM if present
            data = data.trim();
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }

            const json = JSON.parse(data);
            const hindiVerses = {};
            let count = 0;

            // Iterate over all entries
            json.forEach(entry => {
                // Filter for Hindi
                if (entry.lang !== 'hindi') return;

                const match = entry.description.match(/।।(\d+)\.(\d+)।।/);

                if (match) {
                    const chapter = parseInt(match[1]);
                    const verse = parseInt(match[2]);
                    const id = `${chapter}-${verse}`;

                    if (entry.authorName === 'Swami Ramsukhdas') {
                        let text = entry.description.replace(/।।\d+\.\d+।।/, '').trim();
                        // Clean up any other artifacts if necessary
                        text = text.replace(/^- /, '').trim();
                        hindiVerses[id] = text;
                        count++;
                    } else if (!hindiVerses[id]) {
                        let text = entry.description.replace(/।।\d+\.\d+।।/, '').trim();
                        text = text.replace(/^- /, '').trim();
                        hindiVerses[id] = text;
                        count++;
                    }
                }
            });

            fs.writeFileSync(outputPath, JSON.stringify(hindiVerses, null, 2));
            console.log(`Successfully wrote ${Object.keys(hindiVerses).length} Hindi verses to ${outputPath}`);

        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching data:', err);
});
