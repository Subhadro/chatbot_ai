import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { extractAndSplitPdf } from '../services/pdfService.js';
import { processAndIndexPdf, queryPdfContext } from '../services/ragService.js';

const router = express.Router();

// Configure file storage with Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({ storage });

// Route 1: Upload and Index PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
		console.log("log added");
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    const pdfId = req.file.filename;

    // Process PDF text
    const chunks = await extractAndSplitPdf(filePath);
    await processAndIndexPdf(chunks, pdfId);

    res.status(200).json({
      message: 'PDF uploaded, processed, and indexed successfully!',
      pdfId,
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process and index PDF' });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Route 2: Query PDF
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is a required field' });
    }

    const answer = await queryPdfContext(question);
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Query Error:', error);
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Gemini API quota or rate limit exceeded. Retry later or check your API plan.',
      });
    }
    res.status(500).json({ error: 'Failed to retrieve answer from PDF' });
  }
});

export default router;