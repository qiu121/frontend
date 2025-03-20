import { ProCard, ProTable,ProForm } from '@ant-design/pro-components';
// import { ProCard, ProForm, ProTable } from '@ant-design/pro-components';

import React, { useEffect, useState } from 'react';
// import * as recordApi from '@/services/api/record';
import * as bookApi from '@/services/api/book';
import { useModel, Link } from '@umijs/max';

import {
  // Breadcrumb,
  Divider,
  Form,
  Input,
  // message,
  Modal,
  // Popconfirm,
  Button,
  Tag,
} from 'antd';
// import { QuestionCircleOutlined } from '@ant-design/icons';



export default () => {

  const { initialState } = useModel('@@initialState');

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [dataTotal, setDataTotal] = useState<number>()


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  
    const [form] = ProForm.useForm()
    const [tableList, setTableList] = useState<any>([])

    const handleCancel = () => {
      setIsModalOpen(false);
      form.resetFields()
    };
  const showEditModal = (record: any) => {
    setIsModalOpen(true)
    setModalTitle('借阅图书')
    setModalStatus('update')
    form.setFieldsValue({ id: record.id })
    form.setFieldsValue({ recordName: record.recordName })
  }

  const getAllBook = async (currentPage: number, pageSize: number) => {
    const result = await bookApi.listBooks({currentPage, pageSize})

    if (result.code === 200) {
      const data = result.data.result.records
      const total = result.data.result.total
      console.log(total);
      

      setDataTotal(total)
      setTableList(data)
    }
  }


  const get = async () => {
    await getAllBook(currentPage, pageSize)
  }
  useEffect(() => {
    get()
  }, [])

  const columns: any = [
    {
      title: '书名',
      key: 'title',
      dataIndex: 'title',
      search: false,
      align: 'center',
    },
    {
      title: '作者',
      key: 'author',
      dataIndex: 'author',
      search: false,
      align: "center"
    },

    {
      title: '出版社',
      key: 'publisher',
      dataIndex: 'publisher',
      search: false,
      align: "center"
    },
    {
      title: '图书类别',
      key: 'category',
      dataIndex: 'category',
      search: false,
      align: "center",
      render: (text: any) => {
        return (
          <>
            <Tag color='success'>{text}</Tag>
          </>
        )
      }
    },

    {
      title: '库存数量',
      key: 'stock',
      dataIndex: 'stock',
      search: false,
      align: "center"
    },
    {
      title: '操作',
      key: 'operation',
      align: 'center',
      fixed: 'right',
      search: false,
      render: (text: any, reference: any) => {
        return (
          <>
            <Divider type="vertical" />
            <Button type="primary" onClick={() => {
              showEditModal(reference)
            }}>
              借阅
            </Button>
          </>

        )
      }
    },

  ];
  const handleOk = async () => {
    if (modalStatus === 'update') {
      form.validateFields().then(
        async () => {
          const formDataObj = form.getFieldsValue(true)

          // await recordApi.update(formDataObj);
          // await getAllRecord(currentPage,pageSize)
          setModalStatus('')
          setIsModalOpen(false)

          form.resetFields()
        }
      )
    } else if (modalStatus === 'add') {
      form.validateFields().then(
        async () => {
          const { recordName } = form.getFieldsValue(true)
          setIsModalOpen(false)

          const recordParam ={userId,recordName}
          await recordApi.add(recordParam);
          await getAllRecord(currentPage,pageSize)
          setModalStatus('')
          setIsModalOpen(false)
          form.resetFields()
        },
        (err: any) => {
          console.log(err)
          return
        }
      )
    }
  }
  return (
    <>
      <ProCard boxShadow split="vertical">

        <ProCard ghost>
          <ProTable
            columns={columns}
            dataSource={tableList}
            rowKey="id"
            headerTitle={
              <>
              </>
            }
            toolbar={{
              actions: [
                <>

                </>
              ],
            }}

            search={false}
            pagination={
              {
                total: dataTotal,
                pageSize: pageSize,
                current: currentPage,
                showQuickJumper: true,
                showSizeChanger: true,
                hideOnSinglePage: false,

                onChange: (page, size) => {

                  setCurrentPage(page)
                  setPageSize(size)
                  getAllBook(page, size)

                },

              }
            }

          />

          <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
            <Form
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              form={form}
            >
              <Form.Item hidden name="id" label="id">
                {/* <Input onChange={onIdChange} /> */}
              </Form.Item>

              <Form.Item name="recordName" label="实验记录名称" rules={[{ required: true }]}>
                {/* <Input onChange={onRecordNameChange} /> */}
              </Form.Item>

            </Form>

          </Modal>

        </ProCard>
      </ProCard>
    </>
  );
};
