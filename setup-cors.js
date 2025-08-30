// Script to set up CORS for Firebase Storage
// This needs to be run with proper Google Cloud SDK authentication

const { Storage } = require('@google-cloud/storage');

async function setupCORS() {
  const storage = new Storage({
    projectId: 'ai-content-creator-editor',
  });

  const bucketName = 'ai-content-creator-editor.firebasestorage.app';
  const bucket = storage.bucket(bucketName);

  const corsConfiguration = [
    {
      origin: ['http://localhost:3000', 'https://localhost:3000'],
      method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
      maxAgeSeconds: 3600,
      responseHeader: ['Content-Type', 'Authorization', 'Range'],
    },
  ];

  try {
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('CORS configuration set successfully');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

setupCORS();