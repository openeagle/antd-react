import { useState } from 'react';
import { ConfigProvider, DatePicker, message } from 'antd';
import 'antd/dist/antd.less';
import zhCN from 'antd/lib/locale/zh_CN';
import moment, { Moment } from 'moment';
import 'moment/dist/locale/zh-cn';

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
    </ConfigProvider>
  );
}

export default App;
