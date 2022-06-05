import { Button, Space, Table } from "antd";
import type { ColumnsType, TableProps } from "antd/lib/table";
import Mock from "mockjs";
import { useNavigate } from "react-router-dom";
import useQueryTable from "../../src/use-query-table";

interface DataType {
  key: React.Key;
  name: string;
  chinese: number;
  math: number;
  english: number;
}

const UseQueryTableTester: React.FC = () => {
  const navigate = useNavigate();
  const [tableState, tableInstance] = useQueryTable<DataType>({
    request({ params, pagination, filters, sorters }) {
      console.log({ params, pagination, filters, sorters });
      return Promise.resolve(
        Mock.mock({
          "data|15": [
            {
              "key|+1": 1,
              "name|1": [
                "John Brown",
                "Jim Green",
                "Jim Black",
                "Jim Red",
                "Jim Blue",
              ],
              "chinese|60-100": 60,
              "math|60-100": 60,
              "english|60-10": 60,
            },
          ],
          total: 100,
        })
      );
    },
  });
  const columns: ColumnsType<DataType> = [
    {
      title: "Name",
      dataIndex: "name",
      filters: [
        {
          text: "Joe",
          value: "Joe",
        },
        {
          text: "Jim",
          value: "Jim",
        },
        {
          text: "Submenu",
          value: "Submenu",
          children: [
            {
              text: "Green",
              value: "Green",
            },
            {
              text: "Black",
              value: "Black",
            },
          ],
        },
      ],
      filteredValue: tableState.filters["name"],
      // specify the condition of filtering result
      // here is that finding the name started with `value`
      onFilter: (value: any, record) => record.name.indexOf(value) === 0,
    },
    {
      key: "chinese",
      title: "Chinese Score",
      dataIndex: "chinese",
      filters: [
        {
          text: "90",
          value: 90,
        },
        {
          text: 80,
          value: 80,
        },
      ],
      filteredValue: tableState.filters["chinese"],
      onFilter: (value: any, record) => record.chinese > value,
      sorter: {
        compare: (a, b) => a.chinese - b.chinese,
        multiple: 3,
      },
      sortOrder: tableState.sorters["chinese"],
    },
    {
      title: "Math Score",
      dataIndex: "math",
      sorter: {
        compare: (a, b) => a.math - b.math,
        multiple: 2,
      },
      sortOrder: tableState.sorters["math"],
    },
    {
      title: "English Score",
      dataIndex: "english",
      sorter: {
        compare: (a, b) => a.english - b.english,
        multiple: 1,
      },
      sortOrder: tableState.sorters["english"],
    },
  ];
  return (
    <div className="container mx-auto">
      <Space className="my-2">
        <Button
          type="default"
          onClick={() => navigate(`/test?ts=${Date.now()}`)}
        >
          Test
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={tableState.data}
        pagination={tableState.pagination}
        onChange={tableInstance.updateByTableChange}
      />
    </div>
  );
};

export default UseQueryTableTester;
