import { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/dist/locale/zh-cn';

const TestPage = lazy(() => import('./test/index'));

moment.locale('zh-cn');

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <Routes>
          <Route
            path="/test"
            element={
              <Suspense fallback={<>...</>}>
                <TestPage />
              </Suspense>
            }
          />
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
