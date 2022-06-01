import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import { Form } from 'antd';
import defaultSerializer from '../utils/serializer';

declare type RecursivePartial<T> = T extends object
  ? {
      [P in keyof T]?: T[P] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[P] extends object
        ? RecursivePartial<T[P]>
        : T[P];
    }
  : any;

export interface UseQueryFormHistoryState {
  form?: {
    /** key 值是表单唯一标识 */
    [key: string]: string;
  };
}

export interface UseQueryFormOption<Values> {
  /** 表单标识，默认 default，存在多表单时需要区分命名 */
  name?: string;
  /** 路由参数解析 */
  param?(location: Location): RecursivePartial<Values>;
  /** 持久序列化 */
  serializer?: {
    parse(values: string): RecursivePartial<Values>;
    stringify(values: Values): string;
  };
}

function useQueryForm<Values = any>(option: UseQueryFormOption<Values> = {}) {
  const {
    name: formName = 'default',
    param: paramParse,
    serializer: serializer = defaultSerializer,
  } = option;

  const ref = useRef<{
    routeKey: string;
  }>({ routeKey: '' });
  const [form] = Form.useForm<Values>();
  const location = useLocation();

  useEffect(() => {
    // 同一路由只初始化一次，在首次访问和新开同路由页面时需要初始化
    if (location.key === ref.current.routeKey) {
      return;
    }
    ref.current.routeKey = location.key;
    const hisrotyCache = ((history.state || {}) as UseQueryFormHistoryState)
      .form?.[formName];
    if (hisrotyCache) {
      form.setFieldsValue(serializer?.parse(hisrotyCache));
    } else {
      // TODO: 表单有变更的情况才需要重置
      form.resetFields();
      if (paramParse) {
        const paramValues = paramParse(location);
        if (paramValues) {
          form.setFieldsValue(paramValues);
        }
      }
    }
  }, [location.key]);

  const persist = useCallback(() => {
    // 这里使用 history.replaceState 替换状态而不是使用 react-router 提供的方法是因为 react-router 在替换状态时会更新 router key
    history.replaceState(
      Object.assign({}, history.state, {
        form: {
          [formName]: serializer.stringify(form.getFieldsValue()),
        },
      }),
      '',
      location.pathname + location.search + location.hash
    );
  }, [form, serializer]);

  return [
    useMemo(() => {
      return Object.assign(form, {
        persist,
      });
    }, [form, persist]),
  ] as unknown as [
    typeof form & {
      persist: typeof persist;
    }
  ];
}

export default useQueryForm;
