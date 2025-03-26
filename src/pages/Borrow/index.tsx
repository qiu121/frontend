import { ProTable } from '@ant-design/pro-components';
import React from 'react';
import * as borrowApi from '@/services/api/borrow';
import { useModel } from '@umijs/max';
import { Tag } from 'antd';
import dayjs from 'dayjs';

interface BorrowRecord {
  id: string;
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
  // 获取当前用户信息
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser || {};


  // 定义表格列
  const columns = [
    {
      title: '借阅时间',
      dataIndex: 'createTime',
      align: 'center',
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'),
      search: true,
    },
    {
      title: '书籍名称',
      dataIndex: 'bookName',
      align: 'center',
      search: true,

    },
    {
      title: '借阅时间',
      dataIndex: 'borrowTime',
      align: 'center',
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD') : '--'),
      sorter: (a: BorrowRecord, b: BorrowRecord) =>
        dayjs(a.borrowTime).unix() - dayjs(b.borrowTime).unix(),
    },
    {
      title: '预期归还时间',
      dataIndex: 'expectReturnTime',
      align: 'center',
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD') : '--'),
      sorter: (a: BorrowRecord, b: BorrowRecord) =>
        dayjs(a.expectReturnTime).unix() - dayjs(b.expectReturnTime).unix(),
    },
    {
      title: '实际归还时间',
      dataIndex: 'actualReturnTime',
      align: 'center',
      render: (text: string | null) => {
        if (text === null || text === '-' || !dayjs(text).isValid()) {
            return '--';
        } else {
            return dayjs(text).format('YYYY-MM-DD');
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (status: number) => {
        const { text, color } = statusMap[status] || { text: '未知', color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '借阅中', value: 1 },
        { text: '已归还', value: 2 },
        { text: '逾期', value: 3 },
      ],
      onFilter: (value: number, record: BorrowRecord) => record.status === value,
    },
  ];

  return (
    <ProTable<BorrowRecord>
      columns={columns}
      rowKey="id"
      request={async (params) => {
        // 调用后端接口获取借阅记录
        const result = await borrowApi.getBorrowRecord(currentUser.userId);
        if (result.code === 200) {
          let data = result.data.result;

          // 如果有搜索条件，过滤数据（本地过滤）
          if (params.bookName) {
            const searchValue = params.bookName.toLowerCase();
            data = data.filter((item: BorrowRecord) =>
              item.bookName.toLowerCase().includes(searchValue),
            );
          }

          return {
            data,
            success: true,
          };
        }
        return { data: [], success: false };
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
      }}
      pagination={false}  // 禁用分页
      options={{
        reload: true,
        density: true,
        setting: true,
      }}
    />
  );
};