import { ProTable } from '@ant-design/pro-components';
import React from 'react';
import { request ,useModel} from '@umijs/max';
import * as borrowApi from '@/services/api/borrow';
import { Tag } from 'antd';
import dayjs from 'dayjs';

// 定义接口返回的借阅记录类型
interface BorrowRecord {
    id: string;
    userId: string;
    userName: string;
    bookId: string;
    bookName: string;
    borrowTime: string;
    expectReturnTime: string;
    actualReturnTime: string | null;
    status: number;
}

// 定义状态映射
const statusMap = {
    1: { text: '借阅中', color: 'processing' },
    2: { text: '已归还', color: 'success' },
    3: { text: '逾期', color: 'error' },
};

export default () => {
  // 获取当前用户信息
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser||{}; ;

    // console.log(currentUser);
  // 权限控制：仅管理员可访问

//当执行退出登录操作时，会清空currentUser，此时currentUser.role.role为undefined，页面会报错！！！！！！！！！！
// if (currentUser.role.role !== 'admin') {
//     return <div>您没有权限访问此页面</div>;
// }

  // 定义表格列
const columns = [
{
    title: '用户名',
    dataIndex: 'userName',
    align: 'center',
    search: true, // 启用搜索
},
{
    title: '书籍ID',
    dataIndex: 'bookId',
    align: 'center',
},
{
    title: '书籍名称',
    dataIndex: 'bookName',
    align: 'center',
    search: true, // 启用搜索
},
{
    title: '借阅时间',
    dataIndex: 'borrowTime',
    align: 'center',
    render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD') : '--'),
    sorter: true, // 启用排序
},
{
    title: '预期归还时间',
    dataIndex: 'expectReturnTime',
    align: 'center',
    render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD') : '--'),
    sorter: true, // 启用排序
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
    },},
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
    onFilter: true, // 启用过滤
},
];

return (
<ProTable<BorrowRecord>
    columns={columns}
    rowKey="id"
    request={async (params) => {
        // 构造分页和搜索参数
        const page = {
            currentPage: params.current,
            pageSize: params.pageSize,
            ...params, // 包含搜索和过滤参数
        };
        const result = await borrowApi.listBorrowRecord(page);
        if (result.code === 200) {
            const { records, total } = result.data.result;
                return {
                data: records,
                total,
                success: true,
            };
        }
        return { data: [], total: 0, success: false };
    }}
    search={{
    labelWidth: 'auto',
    defaultCollapsed: false,
    }}
    pagination={{
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    defaultPageSize: 10,
    }}
    options={{
    reload: true,
    density: true,
    setting: true,
    }}
    />
    );
};