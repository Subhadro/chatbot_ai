import 'dotenv/config';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { getQdrantConfig } from '../config/qdrant.js';

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
});

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  temperature: 0.2,
});

export const processAndIndexPdf = async (chunks, pdfId) => {
  const docsWithMetadata = chunks.map((chunk) => ({
    ...chunk,
    metadata: { ...chunk.metadata, pdfId },
  }));

  await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, getQdrantConfig());
};

export const queryPdfContext = async (question) => {
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    getQdrantConfig(),
  );
  const candidates = await vectorStore.similaritySearchWithScore(question, 8);
  const scoreThreshold = Number(process.env.RAG_RELEVANCE_THRESHOLD || 0.45);
  const relevantDocs = candidates
    .filter(([, score]) => score >= scoreThreshold)
    .slice(0, 4)
    .map(([doc]) => doc);

  console.log('Qdrant similarity scores:', candidates.map(([, score]) => score));

  if (relevantDocs.length === 0) {
    return "I couldn't find relevant information in the provided documents.";
  }

  const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
	console.log("context ", context);

  const prompt = `You are a helpful assistant. Answer the user's question ONLY based on the provided context below.
If the context does not contain the answer, say "I couldn't find relevant information in the provided documents."

Context:
${context}

Question:
${question}

Answer:`;
	// return {"content" : "testing"};
  const response = await llm.invoke(prompt);
  return typeof response.content === 'string'
    ? response.content
    : response.content.map((part) => (typeof part === 'string' ? part : part.text || '')).join('');
};