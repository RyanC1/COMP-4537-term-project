import path from "path";
import { fileURLToPath } from "url";
import { evaluateAnswer, getModelInfo } from "../services/aiService.js";
import { readPool } from "../config/db.js"; // Import the read pool to securely fetch room data

const MAX_LENGTH = 2000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoCssPath = path.resolve(__dirname, "../public/demo.css");

function validateTextField(fieldName, value) {
  if (typeof value !== "string") {
    return `${fieldName} must be a string.`;
  }

  if (value.trim().length === 0) {
    return `${fieldName} cannot be empty.`;
  }

  if (value.length > MAX_LENGTH) {
    return `${fieldName} must be ${MAX_LENGTH} characters or less.`;
  }

  return null;
}

export async function evaluateAnswerController(req, res) {
  try {
    // We now expect the roomCode instead of the referenceAnswer
    const { roomCode, studentAnswer } = req.body;

    if (!roomCode) {
      return res.status(400).json({ error: "roomCode is required." });
    }

    const studentError = validateTextField("studentAnswer", studentAnswer);
    if (studentError) {
      return res.status(400).json({ error: studentError });
    }

    // 1. Securely fetch the active question and teacher's reference answer from the database
    const [roomRows] = await readPool.execute(
      "SELECT current_question, sample_answer FROM rooms WHERE room_code = ?",
      [roomCode]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "Invalid room code or session has ended." });
    }

    const { current_question, sample_answer } = roomRows[0];

    if (!current_question || !sample_answer) {
      return res.status(400).json({ error: "No active question has been asked in this room yet." });
    }

    // 2. Evaluate the student's answer against the securely fetched database reference
    const result = await evaluateAnswer({
      question: current_question,
      referenceAnswer: sample_answer,
      studentAnswer: studentAnswer
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("AI evaluation error:", error);
    return res.status(500).json({
      error: "Failed to evaluate answer."
    });
  }
}

export function aiHealthController(req, res) {
  return res.status(200).json({
    status: "ok",
    ...getModelInfo()
  });
}

export function aiDemoCssController(req, res) {
  return res.type("text/css").sendFile(demoCssPath);
}

export function aiDemoController(req, res) {
  // Allow inline script for this local demo page while keeping API routes protected.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; connect-src 'self';"
  );

  return res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Evaluate Demo</title>
    <link rel="stylesheet" href="/api/ai/demo.css" />
  </head>
  <body>
    <main class="container">
      <section class="grid">
        <article class="panel">
          <h2>Request</h2>
          <label for="payload">JSON Body</label>
          <textarea id="payload" spellcheck="false">{
  "roomCode": "123456",
  "studentAnswer": "Polymorphism means different objects can be used through the same parent type."
}</textarea>

          <div class="controls">
            <button class="primary" id="sendButton" type="button">Send Request</button>
            <button class="secondary" id="formatButton" type="button">Format JSON</button>
          </div>
          <p class="hint">Simple in-browser tester for your AI evaluate functionality.</p>
        </article>

        <article class="panel">
          <h2>Response</h2>
          <pre id="output">No request sent yet.</pre>
        </article>
      </section>
    </main>

    <script>
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
    </script>
  </body>
</html>`);
}