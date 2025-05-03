import { ProTable } from '@ant-design/pro-components';
import React, { useRef } from 'react';
import { useModel } from '@umijs/max';
import * as borrowApi from '@/services/api/borrow';
import { Tag } from 'antd';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import dayjs from 'dayjs';

// 定义借阅记录类型
interface BorrowRecord {
  id: string;
  userName: string;
  bookName: string;
  borrowTime: string;
  expectReturnTime: string;
  actualReturnTime: string | null;
  status: number;
}

const statusMap = {
  1: { text: '借阅中', color: 'processing' },
  2: { text: '已归还', color: 'success' },
  3: { text: '逾期', color: 'error' },
};

export default () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser || {};
  const actionRef = useRef<ActionType>();

  // 表格列定义，仅用户名和书名可搜索
  const columns: ProColumns<BorrowRecord>[] = [
    {
      title: '用户名',
      dataIndex: 'userName',
      align: 'center',
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      search: {
        transform: (value) => ({ userName: value }),
      },
      fieldProps: {
        onKeyDown: (e) => e.key === 'Enter' && actionRef.current?.reload(),
      },
    },
    {
      title: '书籍名称',
      dataIndex: 'bookName',
      align: 'center',
      sorter: (a, b) => a.bookName.localeCompare(b.bookName),
      search: {
        transform: (value) => ({ bookName: value }),
      },
      fieldProps: {
        onKeyDown: (e) => e.key === 'Enter' && actionRef.current?.reload(),
      },
    },
    {
      title: '借阅时间',
      dataIndex: 'borrowTime',
      align: 'center',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '--',
      sorter: (a, b) =>
        dayjs(a.borrowTime).unix() - dayjs(b.borrowTime).unix(),
      search: false,
    },
    {
      title: '预期归还时间',
      dataIndex: 'expectReturnTime',
      align: 'center',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '--',
      sorter: (a, b) =>
        dayjs(a.expectReturnTime).unix() - dayjs(b.expectReturnTime).unix(),
      search: false,
    },
    {
      title: '实际归还时间',
      dataIndex: 'actualReturnTime',
      align: 'center',
      render: (text) => (text && dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : '--'),
      sorter: (a, b) =>
        dayjs(a.actualReturnTime).unix() - dayjs(b.actualReturnTime).unix(),
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (status) => {
        const { text, color } = statusMap[status] || { text: '未知', color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '借阅中', value: 1 },
        { text: '已归还', value: 2 },
        { text: '逾期', value: 3 },
      ],
      onFilter: true,
      search: false,
    },
  ];

  return (
    <ProTable<BorrowRecord>
      actionRef={actionRef}
      columns={columns}
      rowKey="id"
      request={async (params) => {
        // 解构分页和搜索参数
        const { current, pageSize, userName, bookName } = params;
        const query = {
          currentPage: current,
          pageSize,
          userName: userName || undefined,
          bookName: bookName || undefined,
        };
        const result = await borrowApi.listBorrowRecord(query);
        if (result.code === 200) {
          const { records, total } = result.data.result;
          return { data: records, total, success: true };
        }
        return { data: [], total: 0, success: false };
      }}
      search={{ labelWidth: 'auto', defaultCollapsed: false }}
      pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], defaultPageSize: 10 }}
      options={{ reload: true, density: true, setting: true }}
    />
  );
};