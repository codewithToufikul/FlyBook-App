/**
 * Services Index
 * Central export point for all API services
 */

// API client and utilities
export {
  default as apiClient,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  clearAuth,
  isAuthenticated,
} from './api';

// Authentication services
export {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  updateProfileImage,
  updateCoverImage,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  checkEmailExists,
  refreshToken,
  deleteAccount,
} from './authServices';

// Library services
export {
  fetchAllBooks,
  addBook,
  deleteBook,
  requestBook,
  cancelBookRequest,
  acceptBookRequest,
  transferBook,
  returnBook,
  fetchTransferHistory,
} from './libraryService';

// Types
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from './authServices';

export type {
  Book,
  TransferRecord,
  AddBookData,
} from './libraryService';
