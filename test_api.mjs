
import fetch from 'node-fetch';

async function testApi() {
    const urls = [
        'https://bhagavadgitaapi.in/slok/2/47',
        'https://vedicscriptures.github.io/slok/2/47',
        'https://gita-api.vercel.app/eng/verse/2/47',
        'https://bhagavad-gita3.p.rapidapi.com/v2/chapters/2/verses/47/'
    ];

    console.log("Testing for ENGLISH content...");

    for (const url of urls) {
        try {
            console.log(`\nTesting ${url}...`);
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && !contentType.includes('json')) {
                    console.log("Skipping: Not JSON");
                    continue;
                }

                const data = await response.json();
                console.log("Keys:", Object.keys(data));

                // Look for common english comment fields
                const siva = data.siva?.et || data.sivananda?.et || data.commentary;
                const trans = data.tej?.ht || data.translation;

                if (siva) console.log("FOUND Sivananda (et):", siva.slice(0, 100));
                if (trans) console.log("Found Translation:", trans.slice(0, 100));

                if (siva || trans) {
                    // Check if it really looks like english
                    if (/[a-zA-Z]/.test(siva || trans)) {
                        console.log(`>>> WINNER: ${url}`);
                        return;
                    }
                }
            } else {
                console.log(`Failed: ${response.status}`);
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

testApi();
