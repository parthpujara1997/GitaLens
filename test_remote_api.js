
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
        } catch (e) {
            console.log("Body:", text);
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testRemote();
