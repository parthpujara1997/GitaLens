
const REMOTE_URL = "https://gitalens.onrender.com/api/guidance";

async function testRemote() {
    console.log("Testing remote API:", REMOTE_URL);
    try {
        const response = await fetch(REMOTE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userInput: "Test connection diagnostic",
                history: [] // Simplify
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            if (json.text) {
                console.log("SUCCESS! Response:", json.text);
            } else {
                console.log("Error details:", json.details || json.error);
                if (json.available_models) {
                    const list = Array.isArray(json.available_models) ? json.available_models : (json.available_models.models || []);
                    console.log("Models:", list.map(m => m.name || m.displayName));
                }
            }
        } catch (e) {
            console.log("Body snippet:", text.substring(0, 200));
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testRemote();
