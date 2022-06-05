import React from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox, Select, Space } from "antd";
import useQueryForm from "../../src/use-query-form";

const App: React.FC = () => {
  const navigate = useNavigate();
  const [form] = useQueryForm();
  const onFinish = (values: any) => {
    console.log("Success1:", values);
    form.persist();
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed1:", errorInfo);
  };

  const onReset = () => {
    console.log("Reset1:");
  };

  const handleTest = () => {
    navigate(`/test?ts=${Date.now()}`);
  };

  return (
    <Form
      form={form}
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ remember: true, others: "lucy" }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      onReset={onReset}
      autoComplete="off"
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item label="Others" name="others">
        <Select allowClear style={{ width: 120 }}>
          <Select.Option value="jack">Jack</Select.Option>
          <Select.Option value="lucy">Lucy</Select.Option>
          <Select.Option value="Yiminghe">yiminghe</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="remember"
        valuePropName="checked"
        wrapperCol={{ offset: 8, span: 16 }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Space>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button type="primary" htmlType="reset">
            Reset
          </Button>
          <Button type="primary" onClick={handleTest}>
            Test
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default App;
