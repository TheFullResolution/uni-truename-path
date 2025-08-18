// Common JSend patterns only
export interface JSendSuccess<T> {
  status: 'success';
  data: T;
}

export interface JSendError {
  status: 'fail' | 'error';
  message: string;
  code?: string;
}

export type ApiResponse<T> = JSendSuccess<T> | JSendError;

// Utility functions
export const createSuccessResponse = <T>(data: T): JSendSuccess<T> => ({
  status: 'success',
  data,
});

export const createErrorResponse = (
  message: string,
  code?: string,
): JSendError => ({
  status: 'fail',
  message,
  code,
});
