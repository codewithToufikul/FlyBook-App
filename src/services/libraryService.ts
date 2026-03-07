import { get, post, del } from './api';

export interface Book {
  _id: string;
  userId: string;
  bookName: string;
  writer: string;
  details: string;
  imageUrl: string;
  currentDate: string;
  currentTime: string;
  returnTime: string;
  owner: string;
  location?: {
    type: string;
    coordinates: [number, number];
  } | null;
  transfer?: string;
  transferTo?: string;
  requestBy?: string;
  requestName?: string;
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

export const requestBook = async (bookId: string) => {
  return post('/books/request', { bookId });
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
