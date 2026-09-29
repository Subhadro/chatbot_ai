import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const extractAndSplitPdf = async (filePath) => {
  console.log('filepath', filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: fileBuffer });
  let rawText;

  try {
    const pdfData = await parser.getText();
    rawText = pdfData.text;
  } finally {
    await parser.destroy();
  }

  // console.log('Raw PDF Length (chars):', rawText.length);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,    // Ensures larger chunks (adjust between 500-1500)
    chunkOverlap: 200,   // Keeps context continuous between chunks
  });

  const chunks = await splitter.createDocuments([rawText]);

  console.log('Total Chunks Created:', chunks.length);
  if (chunks.length > 0) {
    console.log('Chunk 0 Length:', chunks[0].pageContent.length);
  }

  return chunks;
};
