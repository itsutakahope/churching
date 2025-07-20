import '@testing-library/jest-dom';

// Mock Firebase
global.firebase = {
  auth: () => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  }),
  firestore: () => ({
    collection: vi.fn(),
    doc: vi.fn(),
  }),
};

// Mock environment variables
process.env.NODE_ENV = 'test';