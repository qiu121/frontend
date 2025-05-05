import { request } from '@umijs/max';


export async function listBooks(page: { [key: string]: any }) {
  return request('/backend/api/books/listBooks', {
    method: 'POST',
    data: page
  });
}

/** 处理借阅请求 */
export async function borrowBooks(borrowBody: { [key: string]: any }) {
  return request('/backend/api/books/borrowBooks', {
    method: 'POST',
    data: borrowBody,
  });
}

export async function deleteBook(bookId: string) {
  return request('/backend/api/books/deleteBook', {
    method: 'DELETE',
    params: { bookId },
  });
}

export async function batchDelete(bookIds: string[]) {
  return request('/backend/api/books/batchDeleteBooks', {
    method: 'DELETE',
    data: bookIds,
  });
}

export async function addBook(book: any) {
  return request('/backend/api/books/addBook', {
    method: 'POST',
    data: book,
  });
}

export async function updateBook(book: any) {
  return request('/backend/api/books/updateBook', {
    method: 'PUT',
    data: book,
  });
}

