import { request } from '@umijs/max';

export async function getBorrowRecord(userId: string) {
    return request('/backend/api/borrow/getBorrowRecord', {
        method: 'POST',
        params: { userId },
    });
}

export async function listBorrowRecord(page: { [key: string]: any }) {
    return request('/backend/api/borrow/listBorrowRecord', {
      method: 'POST',
      data: page,
    });
  }