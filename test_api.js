
const fetch = require('node-fetch');

async function testApi() {
    try {
        console.log("Fetching from bhagavadgitaapi.in...");
        const response = await fetch('https://bhagavadgitaapi.in/slok/1/1');
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        const data = await response.json();
        console.log("Success! Data preview:", JSON.stringify(data).slice(0, 200));
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testApi();
