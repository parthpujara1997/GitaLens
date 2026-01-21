
import fetch from 'node-fetch';

async function testBackend() {
    const API_URL = "http://localhost:3001/api/guidance";

    console.log(`Testing ${API_URL}...`);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Hello, this is a test.",
                history: []
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response body:", errorText);
            return;
        }

        console.log("Headers:", response.headers.raw());

        // Read the stream
        const stream = response.body;
        stream.on('data', (chunk) => {
            console.log("Received chunk:", chunk.toString());
        });

        stream.on('end', () => {
            console.log("Stream ended.");
        });

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testBackend();
