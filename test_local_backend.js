const LOCAL_URL = "http://localhost:3001/api/guidance";

async function testLocal() {
    console.log("Testing local backend:", LOCAL_URL);
    try {
        const response = await fetch(LOCAL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userInput: "Test message",
                history: [],
                mode: 0
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            if (json.text) {
                console.log("SUCCESS! Response:", json.text.substring(0, 100) + "...");
            } else {
                console.log("Error:", json);
            }
        } catch (e) {
            console.log("Body:", text.substring(0, 200));
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testLocal();
