import React, { ReactNode, PureComponent } from 'react';
import { Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
/* eslint-disable-next-line */
import { OptionData } from 'rc-select/lib/interface';
import debounce from 'lodash/debounce';
import request from '@/utils/request';

/**
 * 字段映射
 */
export interface FieldNames<T> {
  label: string | ((item: T) => ReactNode);
  title?: string | ((item: T) => string);
  value: string;
  disabled?: string | ((item: T) => boolean);
  options?: (item: T) => Partial<OptionData>;
}

/**
 * 选择项数据类型
 */
export interface SelectOption<T> extends OptionData {
  source: T;
}

/**
 * 搜索输入框的参数类型
 */
export interface SearchInputProps<T> extends Omit<SelectProps<any>, 'onChange'> {
  /**
   * 是否允许空值查询
   */
  allowEmptySearch?: boolean;
  /**
   * 远程数据源
   */
  dataSource: string | ((value: string) => Promise<T[]>) | T[];
  /**
   * 选项字段映射
   */
  fieldNames?: FieldNames<T>;
  /**
   * 当前选中的值
   */
  value?: T;
  /**
   * 修改选中值后的回调
   */
  onChange?: (value: T) => void;
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
   * 搜索时的数据集合
   */
  searchData: SelectOption<T>[];
  /**
   * 是否正在加载中
   */
  loading: boolean;
  /**
   * 是否处于搜索模式
   */
  searching: boolean;
}

const defaultFieldNames: FieldNames<any> = {
  label: 'label',
  value: 'value',
};

function transformData<T>(fieldNames: FieldNames<T>, data: any): SelectOption<T>[] {
  const { label, value, disabled, title, options } = fieldNames;
  const labelIsFunction = typeof label === 'function';
  if (!Array.isArray(data)) {
    // 注：有的页面搜索接口直接使用列表接口，所以会使数组外面还有一层page相关处理，这里对这样的情况进行处理
    const newData = data.data || [];
    if (Array.isArray(newData)) {
      return newData.map((item: any) => {
        let option: SelectOption<T> = {
          source: item,
          label: labelIsFunction ? (label as Function)(item) : item[label as string],
          value: item[value],
        };
        if (disabled !== undefined) {
          if (typeof disabled === 'function') {
            option.disabled = disabled(item);
          } else {
            option.disabled = item[disabled as string];
          }
        }
        if (title) {
          if (typeof title === 'function') {
            option.title = title(item);
          } else {
            option.title = item[title];
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
  }
  return data.map((item: any) => {
    let option: SelectOption<T> = {
      source: item,
      label: labelIsFunction ? (label as Function)(item) : item[label as string],
      value: item[value],
    };
    if (disabled !== undefined) {
      if (typeof disabled === 'function') {
        option.disabled = disabled(item);
      } else {
        option.disabled = item[disabled as string];
      }
    }
    if (title) {
      if (typeof title === 'function') {
        option.title = title(item);
      } else {
        option.title = item[title];
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

/**
 * @description 选择器组件
 * @param dataSource 远程数据源
 * @param allowEmptySearch <可选>是否允许空值查询
 * @param fieldNames <可选>选项字段映射
 * @param value <可选>当前选中的值
 * @callback onChange <可选>修改选中值后的回调
 * @example
  ```jsx
  <SearchInput
    dataSource="/api/items?name=x"
    fieldNames={{
      label: 'name',
      value: 'id',
    }}
    style={{ width: 200 }}
  />
  ```
 */
class SearchInput<T> extends PureComponent<SearchInputProps<T>, SelectInputState<T>> {
  // eslint-disable-next-line
  public static defaultProps = {
    allowClear: true,
    allowEmptySearch: true,
    fieldNames: defaultFieldNames,
  };

  lastFetchId = 0;

  state: SelectInputState<T> = {
    data: [],
    searchData: [],
    loading: false, // 加载数据中
    searching: false, // 处于搜索模式
  };

  search = debounce((value: string) => {
    if (!this.state.searching) {
      return;
    }

    this.lastFetchId += 1;
    const fetchId = this.lastFetchId;

    if (this.props.allowEmptySearch === false && value === '') {
      this.setState({
        loading: false,
        searchData: [],
      });
    } else {
      const { dataSource } = this.props;
      this.setState({ loading: true });
      let promise: Promise<T[]> | null = null;
      if (typeof dataSource === 'string') {
        promise = request(`${dataSource}${encodeURIComponent(value)}`);
      } else if (typeof dataSource === 'function') {
        promise = dataSource(value);
      }
      if (promise != null) {
        promise
          .then((data) => {
            if (fetchId !== this.lastFetchId) {
              return;
            }
            const { fieldNames = defaultFieldNames } = this.props;
            this.setState({
              searchData: transformData(fieldNames, data),
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
          });
      }
    }
  }, 300);

  constructor(props: SearchInputProps<T>) {
    super(props);

    const { fieldNames = defaultFieldNames } = props;
    this.state = {
      data: props.value ? transformData(fieldNames, [props.value]) : [],
      searchData: [],
      loading: false,
      searching: false,
    };
  }

  componentDidUpdate(prevProps: SearchInputProps<T>) {
    const { value, fieldNames = defaultFieldNames } = this.props;
    if (prevProps.value !== value && value) {
      if (this.state.data.every((item) => item.value !== value[fieldNames.value])) {
        // TODO: 如果处于搜索模式是否可以要这么做？
        // 如果 value 值匹配不到数据集合，那么需要重置数据集合
        // eslint-disable-next-line
        this.setState({
          data: transformData(fieldNames, [this.props.value]),
        });
      }
    }
  }

  handleSearch = (value: string) => {
    if (!this.state.searching) {
      this.setState({ searching: true });
    }
    this.search(value);
  };

  handleDropdownVisibleChange = (visible: boolean) => {
    console.log(visible);
    const { onDropdownVisibleChange } = this.props;
    if (typeof onDropdownVisibleChange === 'function') {
      onDropdownVisibleChange(visible);
    }
    if (visible) {
      if (!this.props.value && this.props.allowEmptySearch !== false) {
        this.setState({
          searching: true,
        });
        this.handleSearch('');
      }
    } else {
      this.lastFetchId += 1;
      this.setState({
        searchData: [],
        loading: false,
        searching: false,
      });
    }
  };

  handleChange = (value: SelectOption<T>['value'], options: any) => {
    const { data, searchData, searching } = this.state;
    if (value) {
      this.setState({
        data: (searching ? searchData : data).filter((item) => {
          return item.value === value;
        }),
        searchData: [],
        loading: false,
        searching: false,
      });
    } else {
      this.setState({
        data: [],
        searchData: [],
        loading: false,
        searching: false,
      });
    }
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(options && options.source);
    }
  };

  render() {
    const {
      allowEmptySearch,
      dataSource,
      fieldNames = defaultFieldNames,
      value,
      ...props
    } = this.props;
    const { data, searchData, loading, searching } = this.state;
    return (
      <Select
        defaultActiveFirstOption={false}
        filterOption={false}
        loading={loading}
        onSearch={this.handleSearch}
        onDropdownVisibleChange={this.handleDropdownVisibleChange}
        showArrow
        showSearch
        {...props}
        allowClear={searching ? false : props.allowClear}
        options={searching ? searchData : data}
        value={value ? value[fieldNames.value] : undefined}
        onChange={this.handleChange}
      />
    );
  }
}

export default SearchInput;
