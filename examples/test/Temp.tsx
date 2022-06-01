import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import qs from 'qs';
import type { FilterValue, SorterResult } from 'antd/lib/table/interface';
import type { ColumnsType, TablePaginationConfig } from 'antd/lib/table';

interface DataType {
  name: {
    first: string;
    last: string;
  };
  gender: string;
  email: string;
  login: {
    uuid: string;
  };
}

interface Params {
  pagination?: TablePaginationConfig;
  sorter?: SorterResult<any> | SorterResult<any>[];
  total?: number;
  sortField?: string;
  sortOrder?: string;
}

const getRandomuserParams = (params: Params) => ({
  results: params.pagination?.pageSize,
  page: params.pagination?.current,
  ...params,
});

const Temp: React.FC = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });
  const [sortOrders, setSortOrders] = useState<{
    [key: string]: SorterResult<DataType>;
  }>({});

  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: { multiple: 1 },
      // sortOrder: sortOrders['name']?.order,
      render: (name) => `${name.first} ${name.last}`,
      width: '20%',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      sorter: { multiple: 2 },
      // sortOrder: sortOrders['gender']?.order,
      filters: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
      ],
      width: '20%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
  ];

  const fetchData = (params: Params = {}) => {
    setLoading(true);
    fetch(
      `https://randomuser.me/api?${qs.stringify(getRandomuserParams(params))}`
    )
      .then((res) => res.json())
      .then(({ results }) => {
        setData(results);
        setLoading(false);
        setPagination({
          ...params.pagination,
          total: 200,
          // 200 is mock data, you should read it from server
          // total: data.totalCount,
        });
      });
  };

  useEffect(() => {
    fetchData({ pagination });
  }, []);

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<DataType> | SorterResult<DataType>[]
  ) => {
    console.log('>> change', newPagination, filters, sorter);
    if (sorter && (Array.isArray(sorter) || sorter.column)) {
      setSortOrders(
        Object.assign(
          {},
          sortOrders,
          (Array.isArray(sorter) ? sorter : [sorter]).reduce(
            (
              rcc: {
                [key: string]: SorterResult<DataType>;
              },
              item
            ) => {
              rcc[item.field as unknown as string] = item;
              return rcc;
            },
            {}
          )
        )
      );
    } else {
      setSortOrders({});
    }
    fetchData({
      // sortField: (sorter as unknown as any).field as string,
      // sortOrder: (sorter as unknown as any).order as string,
      pagination: newPagination,
      ...filters,
    });
  };

  useEffect(() => {
    // console.log('>>', sortOrders, columns);
  }, [sortOrders]);

  return (
    <Table
      columns={columns}
      rowKey={(record) => record.login.uuid}
      dataSource={data}
      pagination={pagination}
      loading={loading}
      onChange={handleTableChange}
    />
  );
};

export default Temp;
