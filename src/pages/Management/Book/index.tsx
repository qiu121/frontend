import { ProCard, ProTable } from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import * as bookApi from '@/services/api/book';
import { useModel } from '@umijs/max';
import { Modal, Button, Tag, message } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';

interface BookType {
  bookId: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  stock: number;
}

export default () => {
  const { initialState } = useModel('@@initialState');
  const [currentUser] = useState(initialState?.currentUser || {});
  const actionRef = useRef<ActionType>();

  const handleDelete = (bookId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这本书吗？',
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await bookApi.deleteBook(bookId);
          if (res.code === 200) {
            message.success('删除成功');
            actionRef.current?.reload();
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (error) {
          console.error(error);
          message.error('删除请求失败，请稍后重试');
        }
      },
    });
  };

  const columns: ProColumns<BookType>[] = [
    {
      title: '书名',
      dataIndex: 'title',
      align: 'center',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: '作者',
      dataIndex: 'author',
      align: 'center',
      sorter: (a, b) => a.author.localeCompare(b.author),
    },
    {
      title: '出版社',
      dataIndex: 'publisher',
      align: 'center',
      sorter: (a, b) => a.publisher.localeCompare(b.publisher),
    },
    {
      title: '出版时间',
      dataIndex: 'publishDate',
      align: 'center',
      sorter: (a, b) => dayjs(a.publishDate).unix() - dayjs(b.publishDate).unix(),
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD') : '--'),
    },
    {
      title: '类别',
      dataIndex: 'category',
      align: 'center',
      render: (text: string) => <Tag color="success">{text}</Tag>,
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      align: 'center',
      sorter: (a, b) => a.stock - b.stock,
      render: (text: number) => (
        <span style={{ color: text > 0 ? 'green' : 'red' }}>{text}</span>
      ),
    },
    {
      title: '操作',
      align: 'center',
      render: (_, record: BookType) => (
        <Button
          type="primary"
          danger
          onClick={() => handleDelete(record.bookId)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <ProCard boxShadow>
      <ProTable<BookType>
        columns={columns}
        actionRef={actionRef}
        rowKey="bookId"
        options={{ fullScreen: true, reload: true, setting: true }}
        request={async (params) => {
          const result = await bookApi.listBooks({
            currentPage: params.current,
            pageSize: params.pageSize,
            title: '',
            author: '',
          });
          if (result.code === 200) {
            return {
              data: result.data.result.records,
              total: result.data.result.total,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
        pagination={{ showSizeChanger: true }}
        search={false}
      />
    </ProCard>
  );
};
