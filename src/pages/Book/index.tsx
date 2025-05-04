import { ProCard, ProTable } from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import * as bookApi from '@/services/api/book';
import { useModel } from '@umijs/max';
import { Form, Modal, Button, Tag, DatePicker, message } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ActionType, ProColumns } from '@ant-design/pro-components';

interface BookType {
  bookId: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  stock: number;
}

interface BorrowFormValues {
  bookId: string;
  borrowTime: Dayjs;
  expectReturnTime: Dayjs;
}

export default () => {
  const { initialState } = useModel('@@initialState');
  const [currentUser] = useState(initialState?.currentUser || {});
  const actionRef = useRef<ActionType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [form] = Form.useForm<BorrowFormValues>();

  const showBorrowModal = (record: BookType) => {
    if (record.stock <= 0) {
      message.warning('当前图书库存不足');
      return;
    }
    setIsModalOpen(true);
    setModalTitle(`借阅图书 - ${record.title}`);
    form.setFieldsValue({
      bookId: record.bookId,
      borrowTime: undefined,
      expectReturnTime: undefined,
    });
  };

  const handleBorrow = async (values: BorrowFormValues) => {
    try {
      const params = {
        bookId: values.bookId,
        userId: currentUser.userId,
        borrowTime: values.borrowTime.format('YYYY-MM-DD'),
        expectReturnTime: values.expectReturnTime.format('YYYY-MM-DD'),
      };

      const response = await bookApi.borrowBooks(params);

      if (response.code === 200) {
        message.success('借阅成功');
        setIsModalOpen(false);
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '借阅失败');
      }
    } catch (error) {
      message.error('借阅操作失败');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.expectReturnTime.isBefore(values.borrowTime)) {
        message.warning('归还时间不能早于借阅时间');
        return;
      }
      await handleBorrow(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
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
      sorter: (a, b) => a.publishDate.localeCompare(b.publishDate),
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
      render: (text: number) => <span style={{ color: text > 0 ? 'green' : 'red' }}>{text}</span>,
    },
    {
      title: '操作',
      align: 'center',
      render: (_, record: BookType) => (
        <Button type="primary" disabled={record.stock <= 0} onClick={() => showBorrowModal(record)}>
          借阅
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
          // 始终按 create_time 和 update_time 降序排序，最新数据排在最上面
          // 优先使用用户操作时传入的 sort，否则使用默认排序
          // 先判断 params.sort（表格用户点击列头时会自动注入），如果为空则回退到默认的 create_time desc,update_time desc。
          const { sort: userSort, current: currentPage, pageSize } = params;
          const sortParam = userSort || 'create_time desc,update_time desc';
          const result = await bookApi.listBooks({
            currentPage,
            pageSize,
            title: '',
            author: '',
            sort: sortParam,
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

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item name="bookId" hidden>
            <input type="hidden" />
          </Form.Item>
          <Form.Item
            label="借阅时间"
            name="borrowTime"
            rules={[{ required: true, message: '请选择借阅时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="预期归还时间"
            name="expectReturnTime"
            rules={[{ required: true, message: '请选择归还时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
};
