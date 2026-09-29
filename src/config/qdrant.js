import 'dotenv/config';

export const getQdrantConfig = () => {
  const url = process.env.QDRANT_URL;

  if (!url) {
    throw new Error('QDRANT_URL must be set in the environment');
  }

  return {
    url,
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'pdf-chat',
    ...(process.env.QDRANT_API_KEY ? { apiKey: process.env.QDRANT_API_KEY } : {}),
  };
};