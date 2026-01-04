async function test() {
    try {
        const response = await fetch("http://localhost:3001/api/guidance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userInput: "I feel lost", mode: 2, level: 1, history: [] })
        });
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
