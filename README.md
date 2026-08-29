<div align="center">
  <img src="public/seal-zhuanshu.png" width="88" alt="明正朔印章" />
  <h1>明正朔</h1>
  <p><strong>辨年号，归正朔。</strong></p>
  <p>东亚历史年号转换与正统纪年工具</p>
  <p><a href="https://siyuan-chat.github.io/ming-zhengshuo/"><strong>打开在线工具</strong></a></p>
</div>

![明正朔网站预览](public/og.png)

## 项目简介

明正朔用于将东亚历史纪年转换为公元年份，并依据项目默认的正统线输出对应纪年。当前完整收录日本自大化至令和的 248 个公年号（含南北朝并行年号及繁简、日文新旧字体），并支持清朝、朝鲜与大韩帝国年号，也收录两晋南北朝、五胡十六国、辽金元、南明等历史纪年样例。

月日部分暂不换算，按输入原样保留。项目明确展示所采用的规则边界，不宣称排除其他史观。

```text
清同治五年三月初八 = 公元1866年 = 大明永历二百二十年三月初八
日本大化元年 = 公元645年 = 唐贞观十九年
日本庆应三年 = 公元1867年 = 大明永历二百二十一年
```

## 使用方式

### 网页

访问 [GitHub Pages 在线版](https://siyuan-chat.github.io/ming-zhengshuo/)。网页转换在浏览器本地完成，不需要登录。

本地开发：

```bash
pnpm install
pnpm dev
```

### 命令行

```bash
python -m pip install -e .
ming-zhengshuo "日本昭和二十年八月十五"
ming-zhengshuo "日本慶応三年"
```

不安装命令时，也可以在项目目录运行：

```powershell
$env:PYTHONPATH='src'
python -m ming_zhengshuo "同治五年三月初八"
```

## 测试

```bash
python -m unittest discover -s tests -v
pnpm test
pnpm build:pages
```

## 日本年号数据

日本年号范围与顺序以日本国立国会图书馆收录的“大化至令和 248 公年号”为总量校验，并参照日本国立公文书馆年号—西历对照表核对边界。项目数据采用简体中文为主名，同时接受日文新字体、旧字体及繁体写法；南北朝并行年号分别标注。

公元 589–959 年的默认正朔线补入隋、唐与五代年号。按本项目规则，唐亡后 907–922 年续唐天祐，923–936 年用后唐，937–959 年用南唐；后梁、后晋、后汉、后周年号保留为可查询的来源年号，但不进入默认正朔线。

- [国立国会图书馆：大化から令和まで日本の元号大事典](https://ndlsearch.ndl.go.jp/books/R100000002-I029653455)
- [国立公文書館亚洲历史资料中心：年号—西历对照表](https://www.jacar.archives.go.jp/apps/help/chronological_table.html)
- [Unicode CLDR：日历与日本年号数据](https://github.com/unicode-org/cldr)
- [搜韵／中国历代人物传记资料库：隋朝与唐朝年历](https://hhl.cnkgraph.com/Calendar/%E5%94%90%E6%9C%9D)
- [台湾教育部《重编国语辞典修订本》：中国历代纪年表](https://dict.revised.moe.edu.tw/appendix.jsp?ID=1&ver=0)

---

<div align="center">辨年号，归正朔。</div>
