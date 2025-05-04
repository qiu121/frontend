import { ProTable } from '@ant-design/pro-components';
import React, { useState, useRef } from 'react';
import * as borrowApi from '@/services/api/borrow';
import { useModel } from '@umijs/max';
import { Tag, Button, Modal, message } from 'antd';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import dayjs from 'dayjs';

interface BorrowRecord {
  borrowRecordId: string;
  bookName: string;
  borrowTime: string;
  expectReturnTime: string;
  actualReturnTime: string | null;
  status: number;
  createTime: string;
}

const statusMap = {
  1: { text: '借阅中', color: 'processing' },
  2: { text: '已归还', color: 'success' },
  3: { text: '已逾期', color: 'error' },
};

export default () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser || {};
  const [actionReload, setActionReload] = useState<number>(0);
  const actionRef = useRef<ActionType>();

  const handleReturn = async (borrowRecordId: string) => {
    try {
      const result = await borrowApi.updateBorrowRecord({
        userId: currentUser.userId,
        borrowRecordId: borrowRecordId,
      });

      if (result.code === 200) {
        message.success('归还成功');
        setActionReload((prev) => prev + 1);
      } else {
        message.error(result.msg || '归还失败');
      }
    } catch (error) {
      console.error('归还请求失败:', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 只修改书籍名称列的配置
  const columns: ProColumns<BorrowRecord>[] = [
    {
      title: '操作时间',
      dataIndex: 'createTime',
      align: 'center',
      render: (text) => (text ? dayjs(text as string).format('YYYY-MM-DD HH:mm:ss') : '----'),
      search: false,
      sorter: (a, b) => dayjs(a.createTime).unix() - dayjs(b.createTime).unix(),
    },
    {
      title: '书籍名称',
      dataIndex: 'bookName',
      align: 'center',
      search: true,
      fieldProps: {
        onKeyDown: (e) => {
          if (e.key === 'Enter') {
            actionRef.current?.reload();
          }
        },
      },
      sorter: (a, b) => a.bookName.localeCompare(b.bookName),
    },
    {
      title: '借阅时间',
      dataIndex: 'borrowTime',
      align: 'center',
      render: (text) => (text ? dayjs(text as string).format('YYYY-MM-DD') : '----'),
      search: false,
      sorter: (a, b) => dayjs(a.borrowTime).unix() - dayjs(b.borrowTime).unix(),
    },
    {
      title: '预期归还时间',
      dataIndex: 'expectReturnTime',
      align: 'center',
      render: (text) => (text ? dayjs(text as string).format('YYYY-MM-DD') : '----'),
      search: false,
      sorter: (a, b) => dayjs(a.expectReturnTime).unix() - dayjs(b.expectReturnTime).unix(),
    },
    {
      title: '实际归还时间',
      dataIndex: 'actualReturnTime',
      align: 'center',
      render: (text) => {
        const value = text as string | null;
        if (!value || value === '-' || !dayjs(value).isValid()) return '----';
        return dayjs(value).format('YYYY-MM-DD');
      },
      search: false,
      sorter: (a, b) => {
        const ta = dayjs(a.actualReturnTime).isValid() ? dayjs(a.actualReturnTime).unix() : 0;
        const tb = dayjs(b.actualReturnTime).isValid() ? dayjs(b.actualReturnTime).unix() : 0;
        return ta - tb;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (_, record) => {
        const { text, color } = statusMap[record.status] || {
          text: '未知',
          color: 'default',
        };
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '借阅中', value: 1 },
        { text: '已归还', value: 2 },
        { text: '逾期', value: 3 },
      ],
      onFilter: (value, record) => record.status === value,
      search: false,
      // 数字状态直接比较
      sorter: (a, b) => a.status - b.status,
    },
    {
      title: '操作',
      align: 'center',
      search: false,
      render: (_, record) => (
        <Button
          type="primary"
          disabled={record.status === 2 || record.status === 3}
          onClick={() => {
            Modal.confirm({
              title: '确认归还',
              content: '确定要归还该图书吗？',
              okText: '确认',
              cancelText: '取消',
              onOk: () => {
                handleReturn(record.borrowRecordId);
              },
            });
          }}
        >
          归还
        </Button>
      ),
    },
  ];

  return (
    <ProTable<BorrowRecord>
      actionRef={actionRef}
      columns={columns}
      rowKey="borrowRecordId"
      request={async (params = {}) => {
        try {
          const result = await borrowApi.getBorrowRecord(currentUser.userId);
          if (result.code === 200) {
            let data = result.data.result;
            if (params.bookName) {
              data = data.filter((item: BorrowRecord) =>
                item.bookName.toLowerCase().includes(params.bookName.toLowerCase()),
              );
            }
            return { data, success: true };
          }
          return { data: [], success: false };
        } catch (error) {
          console.error('获取借阅记录失败:', error);
          return { data: [], success: false };
        }
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
      }}
      pagination={false}
      options={{
        reload: true,
        density: true,
        setting: true,
      }}
      params={{ refresh: actionReload }}
    />
  );
};
