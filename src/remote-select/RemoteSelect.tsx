import React, { ReactNode, PureComponent, useMemo } from 'react';
import { Select } from 'antd';
import { SelectProps } from 'antd/lib/select';

type OptionData = SelectProps['options'];

/**
 * 字段映射
 */
export interface FieldNames<T> {
  label: string | ((item: T) => ReactNode); // 选项显示值
  title?: string;
  value: string; // 选项值
  keyword?: string; // 搜索关键字，默认使用 label
  disabled?: string | ((item: T) => boolean); // 是否禁用
  options?: (item: T) => Partial<OptionData>; // 附加选项属性
}

/**
 * 选择项数据类型
 */
export interface SelectOption<T> extends OptionData {
  label: React.ReactNode;
  value?: T;
  source: T;
}

/**
 * 远程数据选择器的参数类型
 */
export interface RemoteSelectProps<T>
  extends Omit<SelectProps<any>, 'onChange' | 'filterOption'> {
  /**
   * 远程数据源
   */
  dataSource: string | (() => Promise<T[]>) | T[];
  /**
   * 选项字段映射
   */
  fieldNames?: FieldNames<T>;
  /**
   * 当前选中的值
   */
  value?: SelectOption<T>['value'] | SelectOption<T>['value'][];
  /**
   * 过滤配置
   */
  filterOption?:
    | boolean
    | ((inputValue: string, option: SelectOption<T>) => boolean);
  /**
   * 修改选中值后的回调
   */
  onChange?: (
    value: undefined | SelectOption<T>['value'] | SelectOption<T>['value'][],
    options: undefined | T | T[]
  ) => void;
}

/**
 * 搜索输入框组件状态
 */
interface SelectInputState<T> {
  /**
   * 数据集合
   */
  data: SelectOption<T>[];
  /**
   * 是否正在加载中
   */
  loading: boolean;
}

const defaultFieldNames: FieldNames<any> = {
  label: 'label',
  value: 'value',
};

function transformData<T>(
  fieldNames: FieldNames<T> = defaultFieldNames,
  data: T[]
): SelectOption<T>[] {
  const { label, title, value, disabled, options } = fieldNames;
  const labelIsFunction = typeof label === 'function';
  return data.map((item) => {
    let option: SelectOption<T> = {
      source: item,
      label: labelIsFunction
        ? (label as Function)(item)
        : item[label as string],
      value: item[value],
    };
    if (title) {
      option.title = item[title];
    }
    if (disabled !== undefined) {
      if (typeof disabled === 'function') {
        option.disabled = disabled(item);
      } else {
        option.disabled = item[disabled as string];
      }
    }
    if (options && typeof options === 'function') {
      option = {
        ...option,
        ...options(item),
      };
    }
    return option;
  });
}

function createDataSource<T>(
  dataSource: RemoteSelectProps<T>['dataSource']
): () => Promise<T[]> {
  const createPromsie = () => {
    let promise;
    if (typeof dataSource === 'string') {
      promise = request(dataSource);
    } else if (typeof dataSource === 'function') {
      promise = dataSource();
    } else {
      promise = Promise.resolve([]);
    }
    return promise;
  };
  let promise: Promise<T[]> = createPromsie();
  // TOOD: 处理失败的情况
  return () => {
    const oldPromise = promise;
    return promise
      .then((data) => data)
      .catch((error) => {
        if (oldPromise === promise) {
          promise = createPromsie();
        }
        throw error;
      });
  };
}

function useDataSource<T>(
  dataSource: RemoteSelectProps<T>['dataSource']
): () => Promise<T[]> {
  return useMemo<() => Promise<T[]>>(() => {
    return createDataSource<T>(dataSource);
  }, [dataSource]);
}

/**
 * 选择器组件
 * @example
  ```jsx
  <RemoteSelect
    dataSource="/api/item_category"
    fieldNames={{
      label: 'cate_name',
      value: 'id',
    }}
    style={{ width: 200 }}
  />
  ```
 */
class RemoteSelect<T> extends PureComponent<
  RemoteSelectProps<T>,
  SelectInputState<T>
> {
  // eslint-disable-next-line
  static useDataSource = useDataSource;

  static createDataSource = createDataSource;

  // eslint-disable-next-line
  public static defaultProps = {
    allowClear: false,
    fieldNames: defaultFieldNames,
  };

  lastFetchId = 0;

  state: SelectInputState<T> = {
    data: [],
    loading: false, // 加载数据中
  };

  componentDidMount() {
    this.loadDataSource();
  }

  componentDidUpdate(prevProps: RemoteSelectProps<T>) {
    if (this.props.dataSource !== prevProps.dataSource) {
      this.loadDataSource();
    }
  }

  loadDataSource = () => {
    this.lastFetchId += 1;o
    const fetchId = this.lastFetchId;

    const { dataSource } = this.props;
    this.setState({ loading: true });
    let promise: Promise<T[]> | null = null;
    if (typeof dataSource === 'string') {
      promise = request(dataSource);
    } else if (typeof dataSource === 'function') {
      promise = dataSource();
    }
    if (promise != null) {
      promise
        .then((data) => {
          if (fetchId !== this.lastFetchId) {
            return;
          }
          this.setState({
            data: transformData(this.props.fieldNames, data),
            loading: false,
          });
        })
        .catch(() => {
          if (fetchId !== this.lastFetchId) {
            return;
          }
          this.setState({
            loading: false,
          });
          // TODO: 加载失败提示信息
        });
    }
  };

  handleDropdownVisibleChange = (visible: boolean) => {
    const { onDropdownVisibleChange } = this.props;
    if (typeof onDropdownVisibleChange === 'function') {
      onDropdownVisibleChange(visible);
    }
    const { loading, data } = this.state;
    if (visible && !loading && data.length === 0) {
      this.loadDataSource();
    }
  };

  handleChange = (
    value: SelectOption<T>['value'] | SelectOption<T>['value'],
    options: any
  ) => {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      if (options) {
        if (Array.isArray(options)) {
          onChange(
            value,
            (options as SelectOption<T>[]).map((item) => item.source)
          );
        } else {
          onChange(value, (options as SelectOption<T>).source);
        }
      } else {
        onChange(undefined, undefined);
      }
    }
  };

  handleFilterByDefault = (input: string, option: any) => {
    const { fieldNames = defaultFieldNames } = this.props;
    return (
      (
        (option &&
          option.source &&
          option.source[String(fieldNames.keyword || fieldNames.label)]) ||
        ''
      ).indexOf(input) >= 0
    );
  };

  render() {
    const {
      dataSource,
      fieldNames,
      value,
      filterOption,
      showSearch,
      ...props
    } = this.props;
    const { data, loading } = this.state;
    const searchable = showSearch || !!filterOption;
    return (
      <Select
        defaultActiveFirstOption={false}
        loading={loading}
        onDropdownVisibleChange={this.handleDropdownVisibleChange}
        showArrow
        showSearch={searchable}
        filterOption={
          searchable
            ? (filterOption as any) || this.handleFilterByDefault
            : undefined
        }
        {...props}
        options={data}
        value={(data.length > 0 ? value : undefined) as any}
        onChange={this.handleChange}
      />
    );
  }
}

export default RemoteSelect;
