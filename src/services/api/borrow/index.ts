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

export async function updateBorrowRecord(params: {
  userId: string;
  borrowRecordId: string;
}) {
  return request(`/backend/api/borrow/updateBorrowRecord?userId=${params.userId}&borrowRecordId=${params.borrowRecordId}`,{
      method: 'PUT',
      data: {
        // actualReturnTime: params.actualReturnTime,
        status: 2
      }
    }
  );
}