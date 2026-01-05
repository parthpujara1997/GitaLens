import https from 'https';

const url = 'https://vedicscriptures.github.io/slok/1/1';

console.log(`Fetching ${url}...`);

https.get(url, { headers: { 'User-Agent': 'Node.js/1.0' } }, (res) => {
    console.log('Status Code:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Data received:');
        console.log(data);
        try {
            const json = JSON.parse(data);
            console.log('Parsed JSON keys:', Object.keys(json));
        } catch (e) {
            console.error('JSON Parse Error:', e);
        }
    });
}).on('error', (err) => {
    console.error('HTTPS Error:', err);
});
