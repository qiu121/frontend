import { ProCard, ProTable } from '@ant-design/pro-components';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as bookApi from '@/services/api/book';
import { useModel } from '@umijs/max';
import { Form, Input, Modal, Button, Tag, DatePicker, message } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ActionType, ProColumns } from '@ant-design/pro-components';

interface BookType {
  id: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  stock: number;
}

interface BorrowFormValues {
  id: string;
  borrowTime: Dayjs;
  returnTime: Dayjs;
}

export default () => {
  const { initialState } = useModel('@@initialState');
  const [currentUser] = useState(initialState?.currentUser || {});
  const actionRef = useRef<ActionType>();

  // 搜索关键字（自定义搜索框）
  const [searchValue, setSearchValue] = useState<string>('');
  // 全量数据，仅在搜索时使用
  const [fullData, setFullData] = useState<BookType[]>([]);
  // 本地分页状态（仅在搜索时使用）
  const [localCurrentPage, setLocalCurrentPage] = useState<number>(1);
  const [localPageSize, setLocalPageSize] = useState<number>(10);

  // 弹窗相关
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [form] = Form.useForm<BorrowFormValues>();

  /** 获取全量图书数据（用于搜索时本地过滤） */
  const fetchFullBooks = async () => {
    try {
      const result = await bookApi.listBooks({});
      if (result.code === 200) {
        setFullData(result.data.result.records);
      } else {
        message.error('获取全量图书数据失败');
      }
    } catch (error) {
      message.error('获取全量图书数据失败');
    }
  };

  // 当搜索条件有值时，加载全量数据（仅第一次加载时触发）
  useEffect(() => {
    if (searchValue && fullData.length === 0) {
      fetchFullBooks();
    }
    // 每次搜索条件变化时，重置本地分页
    setLocalCurrentPage(1);
  }, [searchValue]);

  /** 本地过滤数据：对全量数据进行搜索过滤 */
  const filteredData = useMemo(() => {
    if (!searchValue) return fullData;
    const lower = searchValue.toLowerCase();
    return fullData.filter(
      (book) =>
        book.title.toLowerCase().includes(lower) ||
        book.author.toLowerCase().includes(lower) ||
        book.publisher.toLowerCase().includes(lower)
    );
  }, [fullData, searchValue]);

  /** 本地分页：对过滤后的数据进行分页 */
  const paginatedData = useMemo(() => {
    const start = (localCurrentPage - 1) * localPageSize;
    return filteredData.slice(start, start + localPageSize);
  }, [filteredData, localCurrentPage, localPageSize]);

  /** 动态生成类别过滤项（基于全量数据） */
  const categoryFilters = useMemo(() => {
    const setCategories = new Set(fullData.map((book) => book.category));
    return Array.from(setCategories).map((cat) => ({
      text: cat,
      value: cat,
    }));
  }, [fullData]);

  /** 显示借阅模态框 */
  const showBorrowModal = (record: BookType) => {
    if (record.stock <= 0) {
      message.warning('当前图书库存不足');
      return;
    }
    setIsModalOpen(true);
    setModalTitle(`借阅图书 - ${record.title}`);
    form.setFieldsValue({
      id: record.id,
      borrowTime: undefined,
      returnTime: undefined,
    });
  };

  /** 处理借阅请求 */
  const handleBorrow = async (values: BorrowFormValues) => {
    try {
      const params = {
        bookId: values.id,
        userId: currentUser.userId,
        borrowTime: values.borrowTime.format('YYYY-MM-DD'),
        returnTime: values.returnTime.format('YYYY-MM-DD'),
      };

      const response = await bookApi.borrowBook(params);
      if (response.code === 200) {
        message.success('借阅成功');
        setIsModalOpen(false);
        // 搜索为空时刷新后端分页数据，否则重新加载全量数据
        if (!searchValue) {
          actionRef.current?.reload();
        } else {
          fetchFullBooks();
        }
      } else {
        message.error(response.message || '借阅失败');
      }
    } catch (error) {
      message.error('借阅操作失败');
    }
  };

  /** 提交表单 */
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.returnTime.isBefore(values.borrowTime)) {
        message.error('归还时间不能早于借阅时间');
        return;
      }
      await handleBorrow(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /** 关闭弹窗 */
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // 定义列（两套共用同一套列配置）
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
      title: '类别',
      dataIndex: 'category',
      align: 'center',
      // 当搜索有值时，使用动态生成的过滤项；否则由后端返回数据时可能自带过滤项
      filters: searchValue ? categoryFilters : undefined,
      onFilter: searchValue
        ? (value, record) => record.category.indexOf(value as string) > -1
        : undefined,
      render: (text: string) => <Tag color="success">{text}</Tag>,
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
          disabled={record.stock <= 0}
          onClick={() => showBorrowModal(record)}
        >
          借阅
        </Button>
      ),
    },
  ];

  return (
    <ProCard boxShadow>
      {/* 自定义搜索输入框：搜索时直接对全量数据进行过滤 */}
      <Input.Search
        placeholder="搜索书名/作者/出版社"
        allowClear
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />

      {searchValue ? (
        // 当搜索条件有值时，使用本地过滤数据和本地分页
        <ProTable<BookType>
          columns={columns}
          dataSource={paginatedData}
          rowKey="id"
          options={{ fullScreen: true, reload: true, setting: true }}
          pagination={{
            current: localCurrentPage,
            pageSize: localPageSize,
            total: filteredData.length,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setLocalCurrentPage(page);
              setLocalPageSize(pageSize || 10);
            },
          }}
          search={false} // 关闭内置搜索表单
        />
      ) : (
        // 当搜索条件为空时，使用后端分页查询
        <ProTable<BookType>
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          options={{ fullScreen: true, reload: true, setting: true }}
          request={async (params) => {
            const result = await bookApi.listBooks({
              currentPage: params.current,
              pageSize: params.pageSize,
              title: '', // 搜索为空时
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
          search={{ filterType: 'light' }}
        />
      )}

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="借阅时间"
            name="borrowTime"
            rules={[{ required: true, message: '请选择借阅时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="归还时间"
            name="returnTime"
            rules={[{ required: true, message: '请选择归还时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
};
