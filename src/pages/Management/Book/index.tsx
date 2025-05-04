import { ProCard, ProTable } from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import * as bookApi from '@/services/api/book';
import { Modal, Button, Tag, message, Form, Input, DatePicker, InputNumber } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';

interface BookType {
  bookId?: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  stock: number;
}

export default () => {
  const actionRef = useRef<ActionType>();

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [editVisible, setEditVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<BookType | null>(null);
  const [form] = Form.useForm<any>();

  const refresh = () => {
    setSelectedRowKeys([]);
    actionRef.current?.reload();
  };

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
            refresh();
          } else {
            message.error(res.msg || '删除失败');
          }
        } catch {
          message.error('删除请求失败');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 本书吗？`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await bookApi.batchDelete(selectedRowKeys);
          if (res.code === 200) {
            message.success('批量删除成功');
            refresh();
          } else {
            message.warning(res.msg || '批量删除失败');
          }
        } catch {
          message.error('批量删除请求失败');
        }
      },
    });
  };

  const openEdit = (record: BookType) => {
    setCurrentRecord(record);
    form.setFieldsValue({
      ...record,
      publishDate: dayjs(record.publishDate),
    });
    setEditVisible(true);
  };

  const openAdd = () => {
    setCurrentRecord(null);
    form.resetFields();
    setAddVisible(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        publishDate: values.publishDate.format('YYYY-MM-DD'),
      };
      let res;
      if (currentRecord) {
        // 编辑
        res = await bookApi.updateBook({ ...payload, bookId: currentRecord.bookId });
      } else {
        // 新增
        res = await bookApi.addBook(payload as any);
      }
      if (res.code === 200) {
        message.success(currentRecord ? '更新成功' : '新增成功');
        setEditVisible(false);
        setAddVisible(false);
        refresh();
      } else {
        message.error(res.msg || (currentRecord ? '更新失败' : '新增失败'));
      }
    } catch {
      // 校验失败
    }
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
      render: (text) => (text && dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : '----'),
    },
    {
      title: '类别',
      dataIndex: 'category',
      align: 'center',
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (text) => <Tag color="success">{text}</Tag>,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      align: 'center',
      sorter: (a, b) => a.stock - b.stock,
      render: (text) => <span style={{ color: text > 0 ? 'green' : 'red' }}>{text}</span>,
    },
    {
      title: '操作',
      align: 'center',
      render: (_, record) => (
        <>
          <Button type="primary" style={{ marginRight: 8 }} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="primary" danger onClick={() => handleDelete(record.bookId!)}>
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <>
      <ProCard boxShadow>
        <ProTable<BookType>
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          columns={columns}
          actionRef={actionRef}
          rowKey="bookId"
          options={{ fullScreen: true, reload: true, setting: true }}
          toolBarRender={() => [
            <Button key="add" type="primary" onClick={openAdd}>
              新增图书
            </Button>,
            <Button
              key="batchDelete"
              disabled={!selectedRowKeys.length}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>,
          ]}
          request={async (params) => {
            // 始终按 create_time 和 update_time 降序排序，最新数据排在最上面
            // 优先使用用户操作时传入的 sort，否则使用默认排序
            // 先判断 params.sort（表格用户点击列头时会自动注入），如果为空则回退到默认的 create_time desc,update_time desc。
            const { sort: userSort, current: currentPage, pageSize } = params;
            const sortParam = userSort || 'create_time desc,update_time desc';
            const result = await bookApi.listBooks({
              currentPage,
              pageSize,
              sort: sortParam,
            });
            return result.code === 200
              ? {
                  data: result.data.result.records,
                  total: result.data.result.total,
                  success: true,
                }
              : { data: [], total: 0, success: false };
          }}
          pagination={{ showSizeChanger: true }}
          search={false}
        />
      </ProCard>

      <Modal
        title={currentRecord ? '编辑图书' : '新增图书'}
        open={editVisible || addVisible}
        onOk={save}
        onCancel={() => {
          setEditVisible(false);
          setAddVisible(false);
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="书名" rules={[{ required: true, message: '请输入书名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="author" label="作者" rules={[{ required: true, message: '请输入作者' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="publisher"
            label="出版社"
            rules={[{ required: true, message: '请输入出版社' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="publishDate"
            label="出版时间"
            rules={[{ required: true, message: '请选择出版日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请输入类别' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
