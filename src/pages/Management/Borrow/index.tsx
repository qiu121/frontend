import { ProTable } from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import * as borrowApi from '@/services/api/borrow';
import { Tag, Button, Modal, message } from 'antd';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import dayjs from 'dayjs';

// 定义借阅记录类型
interface BorrowRecord {
  borrowRecordId: string;
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
  3: { text: '已逾期', color: 'error' },
};

export default () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  /** 单条删除 */
  const handleDelete = (borrowRecordId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该借阅记录吗？',
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await borrowApi.removeBorrowRecord(borrowRecordId);
          if (res.code === 200) {
            message.success('删除成功');
            actionRef.current?.reload();
            setSelectedRowKeys([]);
          } else {
            message.error(res.message || '删除失败');
          }
        } catch {
          message.error('删除请求失败');
        }
      },
    });
  };

  /** 批量删除 */
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await borrowApi.batchRemoveBorrowRecord(selectedRowKeys);
          if (res.code === 200) {
            message.success('批量删除成功');
            actionRef.current?.reload();
            setSelectedRowKeys([]);
          } else {
            message.error(res.message || '批量删除失败');
          }
        } catch {
          message.error('批量删除请求失败');
        }
      },
    });
  };

  const columns: ProColumns<BorrowRecord>[] = [
    {
      title: '用户名',
      dataIndex: 'userName',
      align: 'center',
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      search: true,
      // search: {
      //   transform: (value) => ({ userName: value }),
      // },
      fieldProps: {
        onKeyDown: (e) => e.key === 'Enter' && actionRef.current?.reload(),
      },
    },
    {
      title: '书籍名称',
      dataIndex: 'bookName',
      align: 'center',
      sorter: (a, b) => a.bookName.localeCompare(b.bookName),
      search: true,
      fieldProps: {
        onKeyDown: (e) => e.key === 'Enter' && actionRef.current?.reload(),
      },
    },
    {
      title: '借阅时间',
      dataIndex: 'borrowTime',
      align: 'center',
      render: (text) => (text ? dayjs(text as string).format('YYYY-MM-DD') : '----'),
      sorter: (a, b) => dayjs(a.borrowTime).unix() - dayjs(b.borrowTime).unix(),
      search: false,
    },
    {
      title: '预期归还时间',
      dataIndex: 'expectReturnTime',
      align: 'center',
      render: (text) => (text ? dayjs(text as string).format('YYYY-MM-DD') : '----'),
      sorter: (a, b) => dayjs(a.expectReturnTime).unix() - dayjs(b.expectReturnTime).unix(),
      search: false,
    },
    {
      title: '实际归还时间',
      dataIndex: 'actualReturnTime',
      align: 'center',
      render: (text) => (text && dayjs(text as string).isValid() ? dayjs(text as string).format('YYYY-MM-DD') : '----'),
      sorter: (a, b) => dayjs(a.actualReturnTime).unix() - dayjs(b.actualReturnTime).unix(),
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
        { text: '已逾期', value: 3 },
      ],
      onFilter: (value, record) => record.status === value,
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'actions',
      align: 'center',
      search: false,
      render: (_, record) => (
        <Button type="primary" danger onClick={() => handleDelete(record.borrowRecordId)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <ProTable<BorrowRecord>
      actionRef={actionRef}
      rowKey="borrowRecordId"               // ← 这里改成 borrowRecordId
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys as string[]),
      }}
      toolBarRender={() => [
        <Button
          key="batchDelete"
          disabled={selectedRowKeys.length === 0}
          onClick={handleBatchDelete}
        >
          批量删除
        </Button>,
      ]}
      request={async (params) => {
        // 解构分页、筛选和排序参数
        const { current, pageSize, userName, bookName, sort: userSort } = params;
        const defaultSort = 'create_time desc,update_time desc';
        const query = {
          currentPage: current,
          pageSize,
          userName: userName || undefined,
          bookName: bookName || undefined,
          sort: userSort || defaultSort,
        };
        const result = await borrowApi.listBorrowRecord(query);
        if (result.code === 200) {
          // const { records, total } = result.data.result;
          let data = result.data.result.records;
          const total = result.data.result.total;
          // 二次过滤
          if (params.userName) {
            data = data.filter((item: BorrowRecord) =>
              item.userName.toLowerCase().includes(params.userName.toLowerCase()),
            );
          }
          if (params.bookName) {
            data = data.filter((item: BorrowRecord) =>
              item.bookName.toLowerCase().includes(params.bookName.toLowerCase()),
            );
          }
          return { data, total, success: true };
        }
        return { data: [], total: 0, success: false };
      }}
      search={{ labelWidth: 'auto', defaultCollapsed: false }}
      pagination={{
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        defaultPageSize: 10,
      }}
      options={{ reload: true, density: true, setting: true }}
    />
  );
};
