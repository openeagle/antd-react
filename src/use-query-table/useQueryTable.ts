import { Reducer, useState } from "react";
import { useReducer, useRef } from "react";
import { useEffect, useMemo } from "react";
import {
  FilterValue,
  SortOrder,
  TablePaginationConfig,
  SorterResult,
} from "antd/es/table/interface";
import useNavigation from '../use-navigation'

export interface QueryTableHistoryState {
  table?: {
    /** key 值是表格的唯一标识 */
    [key: string]: Pick<
      QueryTableState<any>,
      "pagination" | "sorters" | "filters"
    >;
  };
}

export interface QueryTableState<RecordType> {
  invalidate: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  sorters: Record<string, SortOrder>;
  filters: Record<string, (string | number | boolean)[] | null>;
  data: RecordType[];
  error?: Error;
  loading: boolean;
}

export interface QueryTableOption<RecordType, Params> {
  /** 表格标识，默认 default，存在多表格时需要区分命名 */
  name?: string;
  /**
   * request 的参数，修改之后会触发更新
   *
   * @example pathname 修改重新触发 request
   * params={{ pathName }}
   */
  params?: Params;
  /**
   * 附加状态，一般用于在初始化时读取路由信息，获取额外设置的状态，例如：在路由跳转后希望新路由能够按指定字段排序的方式展示。
   *
   * ps：在重置状态的时候，只会使用初始化状态，而不会使用附加状态。
   */
  extras?(): QueryTableState<RecordType>;
  /**
   * 初始化状态，一般用于设置初始化的分页大小、字段排序或过滤
   */
  defaultPagination?: Partial<QueryTableState<RecordType>["pagination"]>;
  defaultSorters?: QueryTableState<RecordType>["sorters"];
  defaultFilters?: QueryTableState<RecordType>["filters"];
  /** @name 一个获得 dataSource 的方法 */
  request(
    options: {
      params?: Params;
    } & QueryTableState<RecordType>
  ): Promise<{
    data: RecordType[];
    total: number;
  }>;
  /** 是否需要手动触发首次请求，默认为 false */
  manualRequest?: boolean;
}

type UseQueryTableAction<RecordType> =
  | {
      type: "LOAD_REQUEST";
    }
  | {
      type: "LOAD_FAILURE";
      payload: Error;
    }
  | {
      type: "LOAD_SUCCESS";
      payload: {
        total: number;
        data: RecordType[];
      };
    }
  | {
      type: "UPDATE";
      payload: Pick<
        QueryTableState<RecordType>,
        "invalidate" | "pagination" | "sorters" | "filters"
      >;
    }
  | {
      type: "RESET";
      payload: QueryTableState<RecordType>;
    };

function reducer<RecordType>(
  state: QueryTableState<RecordType>,
  action: UseQueryTableAction<RecordType>
): QueryTableState<RecordType> {
  switch (action.type) {
    case "LOAD_REQUEST": {
      return {
        ...state,
        loading: true,
      };
    }
    case "LOAD_FAILURE": {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }
    case "LOAD_SUCCESS": {
      return {
        ...state,
        invalidate: false,
        pagination: {
          ...state.pagination,
          total: action.payload.total,
        },
        data: action.payload.data,
        error: undefined,
        loading: false,
      };
    }
    case "UPDATE": {
      return {
        ...state,
        ...action.payload,
        invalidate: action.payload.invalidate ?? true,
      };
    }
    case "RESET": {
      return action.payload;
    }
    default:
      return state;
  }
}

const defaultPageIndex = 1;
const defaultPageSize = 15;
const defaultTotal = 0;

function isEqual(obj1: any, obj2: any): boolean {
  if (
    obj1 === obj2 ||
    ((obj1 === null || obj1 === undefined) &&
      (obj2 === null || obj2 == undefined))
  ) {
    return true;
  }
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    return (
      obj1.length === obj2.length &&
      obj1.every((item, index) => isEqual(item, obj2[index]))
    );
  }
  if (obj1 && obj2 && typeof obj1 === "object" && typeof obj2 === "object") {
    return (
      Object.keys(obj1).every((key) => isEqual(obj1[key], obj2[key])) &&
      Object.keys(obj2).every((key) => isEqual(obj1[key], obj2[key]))
    );
  }
  return false;
}

function useQueryTable<RecordType = any, Params = any>(
  option: QueryTableOption<RecordType, Params>
) {
  const {
    name: tableName = "default",
    params,
    extras,
    defaultPagination,
    defaultSorters,
    defaultFilters,
    request,
    manualRequest,
  } = option;

  const navigation = useNavigation();
  const [routeIndex, setRouteIndex] = useState<number>(-1);

  const [state, dispatch] = useReducer<
    Reducer<QueryTableState<RecordType>, UseQueryTableAction<RecordType>>
  >(reducer, {
    invalidate: false,
    pagination: {
      current: defaultPagination?.current ?? defaultPageIndex,
      pageSize: defaultPagination?.pageSize ?? defaultPageSize,
      total: defaultPagination?.total ?? defaultTotal,
    },
    sorters: defaultSorters || {},
    filters: defaultFilters || {},
    data: [],
    loading: false,
  });

  const ref = useRef({
    option,
    state,
    lrt: 0,
  });
  useEffect(() => {
    ref.current.option = option;
    ref.current.state = state;
  });

  const instance = useMemo(() => {
    return {
      getPagination() {
        return ref.current.state.pagination;
      },
      getSort() {
        // TODO: 按字段
        return ref.current.state.sorters;
      },
      getFilter() {
        // TODO: 按字段
        return ref.current.state.filters;
      },
      getData() {
        return ref.current.state.data;
      },
      isFailed() {
        return !!ref.current.state.error;
      },
      isLoading() {
        return ref.current.state.loading;
      },
      update(
        settings: Pick<
          QueryTableState<RecordType>,
          "pagination" | "sorters" | "filters"
        >
      ) {
        const { state: currState } = ref.current;
        dispatch({
          type: "UPDATE",
          payload: {
            invalidate: true,
            pagination: {
              ...currState.pagination,
              ...settings.pagination,
            },
            sorters: settings.sorters ?? currState.sorters,
            filters: settings.filters ?? currState.filters,
          },
        });
      },
      updateByTableChange(
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorters: SorterResult<RecordType> | SorterResult<RecordType>[]
      ) {
        const oldPagination = ref.current.state.pagination;
        const newPagination = pagination;
        const oldFilters = ref.current.state.filters;
        const newFilters = filters;
        const oldSorters = ref.current.state.sorters;
        const newSorters =
          sorters && (Array.isArray(sorters) ? sorters[0] : sorters.column)
            ? (Array.isArray(sorters) ? sorters : [sorters]).reduce(
                (rcc: { [key: string]: SortOrder }, item) => {
                  rcc[item.field as string] = item.order ?? null;
                  return rcc;
                },
                {}
              )
            : {};
        let hasChange = false;
        if (newPagination.pageSize !== oldPagination.pageSize) {
          hasChange = true;
        } else if (!isEqual(newFilters, oldFilters)) {
          hasChange = true;
        } else if (!isEqual(newSorters, oldSorters)) {
          hasChange = true;
        }
        instance.update({
          pagination: {
            current: hasChange
              ? 1
              : pagination.current ?? ref.current.state.pagination.current,
            pageSize:
              pagination.pageSize ?? ref.current.state.pagination.pageSize,
            total: hasChange
              ? 0
              : pagination.total ?? ref.current.state.pagination.total,
          },
          sorters: newSorters,
          filters: newFilters,
        });
      },
      reset() {
        const currOption = ref.current.option;
        dispatch({
          type: "RESET",
          payload: {
            invalidate: true,
            pagination: {
              current:
                currOption.defaultPagination?.current ?? defaultPageIndex,
              pageSize:
                currOption.defaultPagination?.pageSize ?? defaultPageSize,
              total: currOption.defaultPagination?.total ?? defaultTotal,
            },
            sorters: currOption.defaultSorters || {},
            filters: currOption.defaultFilters || {},
            data: [],
            loading: false,
          },
        });
      },
      reload() {
        const now = Date.now();
        ref.current.lrt = now;
        dispatch({ type: "LOAD_REQUEST" });
        request({
          ...ref.current.state,
          params: ref.current.option.params,
        })
          .then((response) => {
            if (now === ref.current.lrt) {
              dispatch({ type: "LOAD_SUCCESS", payload: response });
            }
          })
          .catch((error: Error) => {
            if (now === ref.current.lrt) {
              dispatch({ type: "LOAD_FAILURE", payload: error });
            }
          });
      },
    };
  }, [ref, dispatch]);

  useEffect(() => {
    if (state.invalidate) {
      history.replaceState(
        Object.assign({}, history.state, {
          table: {
            ...history.state?.table,
            [tableName]: {
              pagination: ref.current.state.pagination,
              sorters: ref.current.state.sorters,
              filters: ref.current.state.filters,
            },
          },
        }),
        "",
        window.location.pathname + window.location.search + window.location.hash
      );
      instance.reload();
    }
  }, [state.invalidate]);

  useEffect(() => {
    // 同一路由只初始化一次，在首次访问和新开同路由页面时需要初始化
    if (navigation.index === routeIndex) {
      return;
    }
    setRouteIndex(navigation.index);
    // TODO: react-router replace lead to losing cache.
    const historyState = ((history.state || {}) as any).table?.[tableName];
    if (historyState) {
      dispatch({
        type: "UPDATE",
        payload: {
          ...historyState,
          invalidate: true,
        },
      });
    } else {
      const extras = ref.current.option.extras?.();
      dispatch({
        type: "UPDATE",
        payload: {
          invalidate: !ref.current?.option.manualRequest,
          pagination: {
            current:
              extras?.pagination?.current ??
              ref.current.option.defaultPagination?.current ??
              defaultPageIndex,
            pageSize:
              extras?.pagination?.pageSize ??
              ref.current.option.defaultPagination?.pageSize ??
              defaultPageSize,
            total:
              extras?.pagination?.total ??
              ref.current.option.defaultPagination?.total ??
              defaultTotal,
          },
          sorters: extras?.sorters ?? ref.current.option.defaultSorters ?? {},
          filters: extras?.filters ?? ref.current.option.defaultFilters ?? {},
        },
      });
    }
  }, [ref, dispatch, navigation.index, routeIndex]);

  return [state, instance] as [typeof state, typeof instance];
}

export default useQueryTable;
