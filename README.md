# 明正朔 MingZhengshuo

明正朔是一个面向东亚历史纪年的正朔转换工具。

第一版支持将清朝、日本近现代、朝鲜 / 大韩帝国年号转换为公元年份，并依据默认正统线输出永历连续纪年、民国纪年或公元纪年。月日部分暂不换算，按输入原样保留。

## 使用

开发环境下可以先安装为 editable 包：

```bash
python -m pip install -e .
```

然后运行：

```bash
ming-zhengshuo "同治五年三月初八"
```

输出：

```text
清同治五年三月初八 = 公元1866年 = 大明永历二百二十年三月初八
```

安装为命令后也可以使用：

```bash
ming-zhengshuo "日本昭和二十年八月十五"
```

如果暂时不安装，也可以在 PowerShell 当前会话中设置路径后运行：

```bash
$env:PYTHONPATH='src'
python -m ming_zhengshuo "同治五年三月初八"
```

## 示例

```text
同治五年三月初八
日本昭和二十年八月十五
令和六年五月一日
光武三年四月十五
```

## 测试

```bash
python -m unittest discover -s tests -v
```

辨年号，归正朔。
