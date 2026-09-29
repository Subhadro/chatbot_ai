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
  const relevantDocs = await vectorStore.similaritySearch(question, 4);
  const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
	console.log("the context is here ",context);

  const prompt = `You are a helpful assistant. Answer the user's question ONLY based on the provided context below.
If the context does not contain the answer, say "I couldn't find relevant information in the provided documents."

Context:
${context}

Question:
${question}

Answer:`;
	console.log("response before ",prompt);
  const response = await llm.invoke(prompt);
	console.log("response after");
  return typeof response.content === 'string'
    ? response.content
    : response.content.map((part) => (typeof part === 'string' ? part : part.text || '')).join('');
};