const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();

const { QdrantClient } = require("@qdrant/js-client-rest");

const app = express();
const upload = multer({ dest: "uploads/" });

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

app.use(cors());
app.use(express.json());


// --------------------
// TEST ROUTE
// --------------------

app.get("/", (req, res) => {
  res.json({ message: "DocSpace API is running" });
});


// --------------------
// CHAT
// --------------------

app.post("/api/chat", async (req, res) => {
  try {
    const { query } = req.body;
    const { embedText } = require("./embeddings");

    // 1. Embed question
    const queryVector = await embedText(query);

    // 2. Retrieve relevant chunks
    const results = await qdrant.query("documents", {
      query: queryVector,
      limit: 3,
      with_payload: true,
    });

    const context = results.points
      .map((point) => point.payload.chunk)
      .join("\n\n");

    // 3. Ask Gemini using retrieved context
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
Answer the user's question using ONLY the provided context.

Context:
${context}

Question:
${query}

If the answer is not present in the context, say:
"I couldn't find that information in the document."
      `,
    });

    res.json({
      answer: response.text,
      sources: results.points.map((point) => ({
        filename: point.payload.filename,
        score: point.score,
      })),
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Chat failed",
      error: error.message,
    });
  }
});


// --------------------
// PDF UPLOAD + INDEXING
// --------------------

app.post(
  "/api/documents/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const pdfjsLib = await import(
        "pdfjs-dist/legacy/build/pdf.mjs"
      );

      const { embedText } = require("./embeddings");

      const data = new Uint8Array(
        fs.readFileSync(req.file.path)
      );

      const pdf = await pdfjsLib.getDocument({ data }).promise;

      let text = "";

      // Extract PDF text
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        text += content.items
          .map((item) => item.str)
          .join(" ");

        text += "\n";
      }


      // --------------------
      // SPLIT INTO CHUNKS
      // --------------------

      const chunkSize = 500;
      const chunks = [];

      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }


      // --------------------
      // DELETE OLD VERSION
      // --------------------

      await qdrant.delete("documents", {
        filter: {
          must: [
            {
              key: "filename",
              match: {
                value: req.file.originalname,
              },
            },
          ],
        },
        wait: true,
      });


      // --------------------
      // CREATE EMBEDDINGS
      // --------------------

      const points = [];

      for (let i = 0; i < chunks.length; i++) {
        const vector = await embedText(chunks[i]);

        points.push({
          id: Date.now() + i,

          vector,

          payload: {
            filename: req.file.originalname,
            chunk: chunks[i],
            chunkIndex: i,
          },
        });
      }


      // --------------------
      // STORE IN QDRANT
      // --------------------

      await qdrant.upsert("documents", {
        wait: true,
        points,
      });


      // Remove temporary uploaded file
      fs.unlinkSync(req.file.path);


      res.json({
        message: "PDF uploaded and indexed successfully",
        filename: req.file.originalname,
        pages: pdf.numPages,
        chunks: chunks.length,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to process PDF",
        error: error.message,
      });
    }
  }
);


// --------------------
// QDRANT CONNECTION
// --------------------

async function testQdrant() {
  try {
    const collections = await qdrant.getCollections();

    console.log(
      "Qdrant connected:",
      collections.collections.length,
      "collections"
    );

  } catch (error) {
    console.error(
      "Qdrant connection failed:",
      error.message
    );
  }
}


// --------------------
// CREATE COLLECTION
// --------------------

async function createCollection() {
  try {

    await qdrant.createCollection("documents", {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });

    console.log("Qdrant collection created");

  } catch (error) {

    if (error.status === 409) {
      console.log("Qdrant collection already exists");

    } else {
      console.error(
        "Collection error:",
        error.message
      );
    }
  }
}


// --------------------
// CREATE FILENAME INDEX
// --------------------

async function createFilenameIndex() {
  try {

    await qdrant.createPayloadIndex("documents", {
      field_name: "filename",
      field_schema: "keyword",
    });

    console.log("Filename index ready");

  } catch (error) {

    // Index may already exist
    if (
      error.status === 409 ||
      error.message?.includes("already exists")
    ) {
      console.log("Filename index already exists");

    } else {
      console.error(
        "Index error:",
        error.message
      );
    }
  }
}


// --------------------
// STARTUP
// --------------------

async function initialize() {
  await testQdrant();
  await createCollection();

  // Give collection creation a moment before creating the index
  await createFilenameIndex();
}

initialize();


// --------------------
// START SERVER
// --------------------

app.listen(5000, () => {
  console.log(
    "Server running on http://localhost:5000"
  );
});