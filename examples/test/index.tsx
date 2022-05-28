import { useState } from 'react';
import { DatePicker, Select, message } from 'antd';
import { Moment } from 'moment';
import logo from '../logo.svg';

function App() {
  const [count, setCount] = useState(0);
  const [date, setDate] = useState<Moment | null>(null);
  const handleChange = (value: Moment | null) => {
    message.info(
      `您选择的日期是: ${value ? value.format('YYYY年MM月DD日') : '未选择'}`
    );
    setDate(value);
  };
  const handleSelectChange = (value?: string) => {
    console.log(1, value);
  };

  return (
    <div className="mx-auto container">
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">
        <div className="shrink-0">
          <img className="h-12 w-12" src={logo} alt="ChitChat Logo" />
        </div>
        <div>
          <div className="text-xl font-medium text-black">ChitChat</div>
          <p className="text-slate-500">You have a new message!</p>
        </div>
      </div>
      <div>
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          count is: {count}
        </button>
      </div>
      <div>
        <DatePicker onChange={handleChange} />
        <div style={{ marginTop: 16 }}>
          当前日期：{date ? date.format('YYYY年MM月DD日') : '未选择'}
        </div>
      </div>
      <Select
        allowClear
        defaultValue="lucy"
        style={{ width: 120 }}
        onChange={handleSelectChange}
      >
        <Select.Option value="jack">Jack</Select.Option>
        <Select.Option value="lucy">
          <span className="text-red-500">Lucy</span>
        </Select.Option>
        <Select.Option value="disabled" disabled>
          Disabled
        </Select.Option>
        <Select.Option value="Yiminghe">yiminghe</Select.Option>
      </Select>
    </div>
  );
}

export default App;
