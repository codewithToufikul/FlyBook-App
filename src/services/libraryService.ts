import { get, post, del } from './api';

export interface Book {
  _id: string;
  userId: string;
  uploaderId?: string;
  bookName: string;
  writer: string;
  details: string;
  imageUrl: string;
  currentDate: string;
  currentTime: string;
  returnTime: string;
  owner: string;
  transfer?: string;
  transferredAt?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  } | null;
  transferTo?: string;
  requestBy?: string;
  requestName?: string;
  requestFaceUrl?: string;
  conditionPhotos?: string[];
}

export interface TransferRecord {
  _id: string;
  sendId: string;
  sendName?: string;
  bookImage: string;
  bookName: string;
  bookId: string;
  receiveId: string;
  receiveName?: string;
  transName: string;
  transDate: string;
  transTime: string;
  transfer?: string;
  return?: string;
  conditionPhotos?: string[];
}

export interface AddBookData {
  bookName: string;
  writer: string;
  details: string;
  imageUrl: string;
  returnTime: string;
  userId: string;
  currentDate: string;
  currentTime: string;
  location: { type: string; coordinates: [number, number] } | null;
}

export const fetchAllBooks = async (): Promise<Book[]> => {
  return get<Book[]>('/all-books');
};

export const addBook = async (bookAllData: AddBookData) => {
  return post('/books/add', { bookAllData });
};

export const deleteBook = async (bookId: string) => {
  return del(`/books/delete/${bookId}`);
};

export const requestBook = async (bookId: string, requestFaceUrl?: string) => {
  return post('/books/request', { bookId, requestFaceUrl });
};

export const cancelBookRequest = async (bookId: string) => {
  return post('/books/request/cancel', { bookId });
};

export const acceptBookRequest = async (bookId: string, requestBy: string) => {
  return post('/books/request/accept', { bookId, requestBy });
};

export const transferBook = async (
  bookId: string,
  requestBy: string,
  requestName: string,
) => {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  return post('/books/request/trans', { bookId, requestBy, requestName, date, time });
};

export const confirmBookTransfer = async (
  bookId: string,
  conditionPhotos: string[],
  location: { type: string; coordinates: [number, number]; locationName: string } | null,
): Promise<{ message: string; conditionPhotos: string[] }> => {
  return post('/books/request/confirm', { bookId, conditionPhotos, location });
};

export const returnBook = async (
  bookId: string,
  requestBy: string,
  requestName: string,
  ownerId: string,
) => {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  return post('/books/return', { bookId, requestBy, requestName, date, time, ownerId });
};

export const fetchTransferHistory = async (): Promise<{ success: boolean; data: TransferRecord[] }> => {
  return get('/books/trans');
};

// ─── Onindo Library ────────────────────────────────────────────────────────

export interface OnindoBook {
  _id: string;
  userId: string;
  uploaderId?: string;
  bookName: string;
  writer: string;
  details: string;
  imageUrl: string;
  currentDate: string;
  currentTime: string;
  owner: string;
  requestBy?: string;
  requestName?: string;
  transferTo?: string;
  transfer?: string;
  transferredAt?: string;
}

export interface AddOnindoBookData {
  bookName: string;
  writer: string;
  details: string;
  imageUrl: string;
  userId: string;
  currentDate: string;
  currentTime: string;
  location: { type: string; coordinates: [number, number] } | null;
}

export const fetchAllOnindoBooks = async (): Promise<OnindoBook[]> => {
  return get<OnindoBook[]>('/all-onindo-books');
};

export const fetchUserOnindoBooks = async (userId: string): Promise<{ success: boolean; data: OnindoBook[] }> => {
  return get(`/books/onindo/user/${userId}`);
};

export const addOnindoBook = async (bookAllData: AddOnindoBookData) => {
  return post('/books/onindo/add', { bookAllData });
};

export const deleteOnindoBook = async (bookId: string) => {
  return del(`/onindo/delete/${bookId}`);
};

export const requestOnindoBook = async (bookId: string, requestFaceUrl?: string) => {
  return post('/onindo/books/request', { bookId, requestFaceUrl });
};

export const cancelOnindoBookRequest = async (bookId: string) => {
  return post('/onindo/books/request/cancel', { bookId });
};

export const transferOnindoBook = async (
  bookId: string,
  requestBy: string,
  requestName: string,
) => {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  return post('/onindo/books/request/trans', { bookId, requestBy, requestName, date, time });
};

// ─── Breach of Contract / Defaulters ──────────────────────────────────────────

export interface Defaulter {
  bookId: string;
  bookName: string;
  writer: string;
  imageUrl: string;
  transferredAt: string;
  dueDate: string;
  daysOverdue: number;
  ownerName: string;
  ownerId: string;
  defaulterId: string;
  defaulterName: string;
  defaulterPhone: string;
  faceVerificationUrl: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  } | null;
  conditionPhotos?: string[];
}

export const fetchDefaulters = async (): Promise<{ success: boolean; data: Defaulter[] }> => {
  return get('/books/defaulters');
};

