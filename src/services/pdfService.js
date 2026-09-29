import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const extractAndSplitPdf = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: fileBuffer });
  let rawText;

  try {
    const pdfData = await parser.getText();
    rawText = pdfData.text;
  } finally {
    await parser.destroy();
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([rawText]);
  return chunks;
};