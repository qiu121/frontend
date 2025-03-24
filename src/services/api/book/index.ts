import { request } from '@umijs/max';


export async function listBooks(page: { [key: string]: any }) {
  return request('/backend/api/books/listBooks', {
    method: 'POST',
    data: page
  });
}

/** 处理借阅请求 */
export async function borrowBook(params: { bookId: string; userId: string; borrowTime: string; returnTime: string }) {
  return request('/backend/api/books/borrow', {
    method: 'POST',
    data: params,
  });
}

export async function listRecordByUserId(page: { [key: string]: any }, userId: any) {
  return request(`/backend/api/record/listRecordByUserId/${userId}`, {
    method: 'POST',
    data: page
  });
}

export async function get(options?: { [key: string]: any }) {
  return request('/backend/api/record/get', {
    method: 'GET',
    ...(options || {}),
  });
}


export async function add(options?: { [key: string]: any }) {
  return request('/backend/api/record/add', {
    method: 'POST',
    data: options,
    ...(options || {}),
  });
}

export async function update(options?: { [key: string]: any }) {
  return request('/backend/api/record/update', {
    method: 'PUT',
    data: options,
    ...(options || {}),
  });
}


export async function del(id?: any) {
  return request(`/backend/api/record/del/${id}`, {
    method: 'DELETE',
    ...(id || {}),
  });
}


export async function getRecordByUserId(page: { [key: string]: any }, userId: string | undefined) {
  return request(`/backend/api/record/getRecord/${userId}`, {
    method: 'POST',
    data: page
  });
}
