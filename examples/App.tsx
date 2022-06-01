import { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/dist/locale/zh-cn';

const HomePage = lazy(() => import('./home/index'));
const TestPage = lazy(() => import('./test/index'));
const UseQueryFormPage = lazy(() => import('./use-query-form/index'));

moment.locale('zh-cn');

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<>...</>}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="/test"
            element={
              <Suspense fallback={<>...</>}>
                <TestPage />
              </Suspense>
            }
          />
          <Route
            path="/use-query-form"
            element={
              <Suspense fallback={<>...</>}>
                <UseQueryFormPage />
              </Suspense>
            }
          />
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
