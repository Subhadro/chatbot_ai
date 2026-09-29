import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfRoutes from './src/routes/pdfRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/pdf', pdfRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server running smoothly' });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});