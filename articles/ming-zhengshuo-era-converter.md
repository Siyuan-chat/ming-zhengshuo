---
title: "東アジアの元号を双方向変換する『明正朔』を作った"
emoji: "🗓️"
type: "tech"
topics: ["python", "cli", "opensource", "aiagent"]
published: true
---

![明正朔のカバー画像](https://raw.githubusercontent.com/Siyuan-chat/ming-zhengshuo/main/public/promotion/demo-poster.png)

歴史資料を読んでいると、「唐の貞観十九年は西暦何年か」だけではなく、「その年を日本では何と呼んでいたか」まで知りたくなることがあります。

最初は単純な換算表で済むと思っていました。しかし実際に作り始めると、南北朝のように複数の朝廷が並立する年があり、一つの答えだけを返す設計では情報を落としてしまいます。そこで、元号年と西暦年を往復でき、別地域の同時代の元号も引けるツールとして「明正朔（Ming Zhengshuo）」を作りました。

- Web版: https://siyuan-chat.github.io/ming-zhengshuo/
- GitHub: https://github.com/Siyuan-chat/ming-zhengshuo

変換は言語モデルの推測ではなく、収録データとルールを使う決定論的なエンジンで行います。日本については大化から令和までの公年号248件に加え、南北朝の並行元号や主な表記揺れを収録しています。中国・朝鮮の元号も検索できます。

## まずは動かしてみる

Web版では、元号または西暦年を入力して変換先を選びます。実際の操作は次のような感じです。

![明正朔の操作デモ](https://raw.githubusercontent.com/Siyuan-chat/ming-zhengshuo/main/public/promotion/demo.gif)

大きな画面で確認したい場合は、[MP4版のデモ](https://github.com/Siyuan-chat/ming-zhengshuo/blob/main/docs/promotion/assets/demo.mp4)もあります。

手元でも同じ結果になることを確かめるため、リポジトリのスクリプトでいくつか実行しました。たとえば、唐の貞観十九年から日本の元号を引く場合は次のとおりです。

```bash
python scripts/interchange.py "唐贞观十九年" --to japan --json
```

```text
唐贞观十九年 = 公元645年 = 日本大化元年
```

唐の貞観十九年をいったん西暦645年に正規化し、同じ年の日本では大化元年だったことが分かります。

もう一つ、西暦1338年を日本の元号へ変換してみます。

```bash
python scripts/interchange.py "公元1338年" --to japan --json
```

```text
公元1338年 = 日本建武五年 = 日本北朝历应元年 = 日本南朝延元三年
```

この年には複数の候補があります。明正朔は北朝・南朝の標識を消さず、該当する結果をまとめて返します。後段のプログラムから使うときも、最初の一件だけを取るのではなく、`matches` の各要素にある `polity` や `region` を見るようにしました。

## CLIとPythonから使う

必要なのはPython 3.10以上です。現在はPyPIからの導入ではなく、GitHubのソースから実行またはインストールします。

```bash
git clone https://github.com/Siyuan-chat/ming-zhengshuo.git
cd ming-zhengshuo
python scripts/interchange.py "日本大化元年" --to gregorian --json
```

ローカルパッケージとして使うなら、仮想環境を有効にしたうえでリポジトリのルートからインストールできます。

```bash
python -m venv .venv
# 仮想環境を有効化した後
python -m pip install .
ming-zhengshuo "公元645年" --to japan --json
```

`--to` には `gregorian`、`all`、`china`、`japan`、`korea` などを指定できます。JSON出力には候補だけでなく、地域、政権、精度などのメタデータも入るので、シェルから眺めるときにもAgentから呼ぶときにもこちらが扱いやすいです。

Python APIでは、次のように構造化結果を取得できます。

```python
from ming_zhengshuo import interchange_structured

result = interchange_structured("公元645年", target="japan")
for match in result["matches"]:
    print(match["text"])
```

単一の文字列ではなく候補の配列を返すため、並立する元号を呼び出し側で比較したり、必要な地域だけを選んだりできます。

## Agentから呼び出す

このリポジトリのルートはAgent Skills互換の構成になっており、`SKILL.md` に使い方と変換ルールを書いています。Skills CLIを使う場合は、利用したいプロジェクトのディレクトリで次のように追加できます。

```powershell
$env:DISABLE_TELEMETRY="1"
pnpm dlx skills add Siyuan-chat/ming-zhengshuo --skill ming-zhengshuo --agent codex --copy --yes
```

プロジェクトへのSkillインストールと、インストール先でのスクリプト実行までは確認しています。必要ならJSON CLIをツールとして明示的に登録することもできます。

なお、現在扱うのは年単位です。「同治五年三月初八」のような入力では月日を原文のまま残し、JSONにも `precision: "year"` と記録します。

## おわりに

年号の変換は小さな機能に見えますが、地域をまたいで調べようとすると、並立政権や表記揺れをどう残すかという面白い設計課題がありました。明正朔は、歴史資料の検索、比較、表記正規化、予備調査に使える道具として、MIT Licenseで公開しています。

オンライン版は https://siyuan-chat.github.io/ming-zhengshuo/ 、ソースと詳しい導入手順は https://github.com/Siyuan-chat/ming-zhengshuo にあります。あとで使うかもしれないと思ったら、GitHubでスターしておいてもらえるとうれしいです。
