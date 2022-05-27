import { useState } from 'react';
import { ConfigProvider, DatePicker, message } from 'antd';
import 'antd/dist/antd.less';
import zhCN from 'antd/lib/locale/zh_CN';
import moment, { Moment } from 'moment';
import 'moment/dist/locale/zh-cn';
import logo from './logo.svg';

moment.locale('zh-cn');

function App() {
  const [count, setCount] = useState(0);
  const [date, setDate] = useState<Moment | null>(null);
  const handleChange = (value: Moment | null) => {
    message.info(
      `您选择的日期是: ${value ? value.format('YYYY年MM月DD日') : '未选择'}`
    );
    setDate(value);
  };

  return (
    <ConfigProvider locale={zhCN}>
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
      </div>
    </ConfigProvider>
  );
}

export default App;
