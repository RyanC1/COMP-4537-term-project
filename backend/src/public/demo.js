const payloadInput = document.getElementById("payload");
const output = document.getElementById("output");
const sendButton = document.getElementById("sendButton");
const formatButton = document.getElementById("formatButton");

function writeOutput(value) {
    output.textContent = value;
}

formatButton.addEventListener("click", () => {
    try {
        const parsed = JSON.parse(payloadInput.value);
        payloadInput.value = JSON.stringify(parsed, null, 2);
        writeOutput("JSON formatted successfully.");
    } catch (error) {
        writeOutput("Invalid JSON: " + error.message);
    }
});

sendButton.addEventListener("click", async () => {
    let body;

    try {
        body = JSON.parse(payloadInput.value);
    } catch (error) {
        writeOutput("Invalid JSON body: " + error.message);
        return;
    }

    const headers = {
        "Content-Type": "application/json"
    };

    writeOutput("Sending request...");

    try {
        const response = await fetch("/api/ai/demo", {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });

        const raw = await response.text();
        let parsed;

        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = raw;
        }

        const result = {
            status: response.status,
            statusText: response.statusText,
            apiWarning: response.headers.get("X-API-Warning"),
            data: parsed
        };

        writeOutput(JSON.stringify(result, null, 2));
    } catch (error) {
        writeOutput("Request failed: " + error.message);
    }
});
