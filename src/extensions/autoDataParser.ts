const notWordExp = /[^a-zA-Z0-9_]|$/;

// 获取数组的内容
function subAction(input: string): [string[], number] {
  let len = input.length;
  let left = 1;
  let subStr = "";
  let list = [];
  let end = 0;
  for (let i = 0; i < len; i++) {
    end = i;
    let str = input[i];
    if (str == "[") {
      left++;
      if (left > 1) subStr += str;
    } else if (str == "]") {
      left--;
      if (left == 0) break;
      if (left > 1) subStr += str;
    } else if (left == 1 && str == ",") {
      list.push(subStr);
      subStr = "";
    } else {
      subStr += str;
    }
  }
  list.push(subStr);
  return [list, end];
}
/**
 * 通过指定格式的字符串去获取data内的数据的功能
 * [key:keyName] 获取数组索引值对应的值的数据，如果是二维数组，会获取每一行的索引值对应的数据，key对应的索引来源 keyIndex 参数
 * [1:] 或 [:5] 截取数组
 * [index] 或 [keyName] 或 [$keyName] 获取数组或属性
 * [index:indexVal] 获取二维数组的每一行的第indexVal位置的值
 * $keyName 从 data 获取数据
 * .keyName 从 data.lastData 获取数据，并且如果 data.lastData 是数组，可以对数值的每一项进行取值并得到数值 （data.lastData表示当前操作符可操作的值）
 * 不能使用[keyName]对数值进行取值
 * @param data 初始数据
 * @param keyIndex key对应的索引
 * @param input 字符串
 * @returns
 */
export function autoDataParser(
  data: {
    lastData: any; // 只有这个属性会随着递归发生变化，其他值
    [key: string]: any;
  },
  keyIndex: { [key: string]: number },
  input: string
) {
  if (!input.length) return "lastData" in data ? data.lastData : undefined;
  if (!/^(key:|index:|\d+:|\[|\.|\$)/.test(input)) return input;
  let _data: any = "lastData" in data ? data.lastData : undefined;
  let str = input[0];
  let subInput = "";
  let actionEnd = 0;
  if (str == "$") {
    let sub = input.substring(1);
    let name = sub.substring(0, sub.search(notWordExp));
    _data = name in data ? data[name] : undefined;
    actionEnd = name.length;
  } else if (str == "[") {
    let [arr, end] = subAction(input.substring(1));
    if (arr.length == 1) {
      let res = autoDataParser(
        Object.assign({}, data, { lastData: _data }),
        keyIndex,
        arr[0]
      );
      if (!/^(key|index|\d+):/.test(arr[0]) && res in data.lastData) {
        _data = data.lastData[res];
      } else if (Array.isArray(res)) _data = [...res];
      else _data = res;
    } else {
      let res = arr.map((v) =>
        autoDataParser(
          Object.assign({}, data, { lastData: _data }),
          keyIndex,
          v
        )
      );
      if (
        arr.filter((f) => !/^(key|index|\d+):/.test(f)).length == arr.length
      ) {
        _data = res.map((key) =>
          key in data.lastData ? data.lastData[key] : undefined
        );
      } else {
        _data = res;
      }
    }
    actionEnd = end + 1;
  } else if (str == ".") {
    let sub = input.substring(1);
    let name = sub.substring(0, sub.search(notWordExp));
    if ("lastData" in data) {
      if (Array.isArray(data.lastData)) {
        _data = data.lastData.map((v) => (name in v ? v[name] : undefined));
      } else {
        _data =
          data.lastData && name in data.lastData
            ? data.lastData[name]
            : undefined;
      }
    }
    actionEnd = name.length;
  } else if (input.startsWith("key:")) {
    let name = input.substring("key:".length);
    let key = autoDataParser(
      Object.assign({}, data, { lastData: _data }),
      keyIndex,
      name
    );
    if (key && "lastData" in data && key in keyIndex) {
      if (Array.isArray(data.lastData) && data.lastData.length) {
        if (Array.isArray(data.lastData[0])) {
          _data = [];
          (data.lastData as any[]).forEach((v) => {
            (_data as any[]).push(v[keyIndex[key]]);
          });
        } else {
          _data = data.lastData[keyIndex[key]];
        }
      } else {
        _data = undefined;
      }
    } else {
      _data = undefined;
    }
    return _data;
  } else if (input.startsWith("index:")) {
    let name = input.substring("index:".length);
    let index = Number(
      autoDataParser(
        Object.assign({}, data, { lastData: _data }),
        keyIndex,
        name
      )
    );
    if (
      !Number.isNaN(index) &&
      "lastData" in data &&
      Array.isArray(data.lastData) &&
      data.lastData.length
    ) {
      if (Array.isArray(data.lastData[0])) {
        _data = [];
        (data.lastData as any[]).forEach((v) => {
          (_data as any[]).push(v[index]);
        });
      } else {
        _data = data.lastData[index];
      }
    } else {
      _data = undefined;
    }
    return _data;
  } else if (/^\d*:\d*$/.test(input)) {
    let [start, end] = input.split(":").map((v) => (v ? Number(v) : undefined));
    if ("lastData" in data && Array.isArray(data.lastData)) {
      _data = (data.lastData as any[]).slice(
        start || 0,
        end === undefined ? data.lastData.length : end
      );
    }
    return _data;
  }
  subInput = input.substring(actionEnd + 1);
  if (subInput)
    _data = autoDataParser(
      Object.assign({}, data, { lastData: _data }),
      keyIndex,
      subInput
    );
  return _data;
}
