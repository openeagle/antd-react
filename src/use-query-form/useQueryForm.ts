import { MutableRefObject, useState } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Form, FormInstance } from "antd";
import defaultSerializer from "../utils/serializer";

declare type RecursivePartial<T> = T extends object
  ? {
      [P in keyof T]?: T[P] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[P] extends object
        ? RecursivePartial<T[P]>
        : T[P];
    }
  : any;

export interface QueryFormHistoryState {
  form?: {
    /** key 值是表单唯一标识 */
    [key: string]: string;
  };
}

export interface QueryFormOption<Values> {
  /** 表单标识，默认 default，存在多表单时需要区分命名 */
  name?: string;
  form?:
    | FormInstance<Values>
    | MutableRefObject<FormInstance<Values> | undefined>;
  /**
   * 附加参数解析，可以是路由参数、搜索和 hash，或者其他来来源的附加参数。
   *
   * ps：附加参数只有在初始化的时候会调用一次，在重置时会使用初始化状态，而附加参数不会生效。
   */
  extras?(): RecursivePartial<Values>;
  /** 持久序列化，默认为内置的 serializer，支持 moment 的序列化 */
  serializer?: {
    parse(values: string): RecursivePartial<Values>;
    stringify(values: Values): string;
  };
}

function useQueryForm<Values = any>(option: QueryFormOption<Values> = {}) {
  const {
    name: formName = "default",
    form,
    extras,
    serializer: serializer = defaultSerializer,
  } = option;

  const location = useLocation();
  const [routeIndex, setRouteIndex] = useState<number>(-1);

  const [innerForm] = Form.useForm<Values>();
  const [currentForm, setCurrentForm] = useState<
    FormInstance<Values> | undefined
  >(form ? ("current" in form ? form.current : form) : innerForm);

  useEffect(() => {
    const latestForm = form
      ? "current" in form
        ? form.current
        : form
      : innerForm;
    if (currentForm !== latestForm) {
      setCurrentForm(latestForm);
      // 表单变化了，需要重置路由 key
      setRouteIndex(-1);
    }
  }, [form, innerForm, currentForm]);

  useEffect(() => {
    if (!currentForm) {
      return;
    }
    // 同一路由只初始化一次，在首次访问和新开同路由页面时需要初始化
    if (history.state.idx === routeIndex) {
      return;
    }
    setRouteIndex(history.state.idx);
    const hisrotyCache = ((history.state || {}) as QueryFormHistoryState)
      .form?.[formName];
    if (hisrotyCache) {
      // TODO: react-router replace lead to losing cache.
      currentForm.setFieldsValue?.(serializer.parse(hisrotyCache));
    } else {
      currentForm.resetFields?.();
      if (extras) {
        const paramValues = extras();
        if (paramValues) {
          currentForm.setFieldsValue?.(paramValues);
        }
      }
    }
  }, [location.key, routeIndex, currentForm]);

  const persist = useCallback(() => {
    // 这里使用 history.replaceState 替换状态而不是使用 react-router 提供的方法是因为 react-router 在替换状态时会更新 router key
    const fieldsValue = currentForm?.getFieldsValue?.();
    const formHistoryState = Object.assign(
      {},
      history.state
    ) as QueryFormHistoryState;
    if (fieldsValue) {
      formHistoryState.form = Object.assign({}, formHistoryState.form, {
        [formName]: serializer.stringify(fieldsValue),
      });
    } else {
      const newForms = Object.assign({}, formHistoryState.form);
      delete newForms[formName];
      formHistoryState.form = newForms;
    }
    history.replaceState(
      formHistoryState,
      "",
      window.location.pathname + window.location.search + window.location.hash
    );
  }, [currentForm, serializer]);

  return [
    useMemo(() => {
      const queryForm = Object.assign({}, currentForm || null, {
        persist: persist,
      });
      const oldSubmit = queryForm.submit
      queryForm.submit = () => {
        queryForm.persist()
        oldSubmit.call(queryForm)
      }
      const oldResetFields = queryForm.resetFields
      queryForm.resetFields = (...args) => {
        oldResetFields.call(queryForm, ...args)
        queryForm.persist()
      }
      return queryForm;
    }, [currentForm, persist]),
  ] as unknown as [
    typeof innerForm & {
      persist: typeof persist;
    }
  ];
}

export default useQueryForm;
