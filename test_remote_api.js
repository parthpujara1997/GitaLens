
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
            console.log("Error Message:", json.details);

            const models = json.available_models;
            if (models) {
                // Check structure (array or object wrapper)
                const list = Array.isArray(models) ? models : (models.models || []);
                if (Array.isArray(list) && list.length > 0) {
                    console.log("Model Names:", list.map(m => m.name || m.displayName));
                } else {
                    console.log("Models raw:", JSON.stringify(models).substring(0, 500));
                }
            } else {
                console.log("No available_models field.");
            }
        } catch (e) {
            console.log("Body snippet:", text.substring(0, 200));
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testRemote();
