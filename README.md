# LWCworking - Salesforce LWC コンポーネント群（リファレンス・アーカイブ）

このリポジトリは、Salesforce Lightning Web Component（LWC）開発の学習・リファレンスを目的とするアーカイブリポジトリです。

## ℹ️ 重要：コンポーネントは独立リポジトリに移行済み

**このリポジトリは参考用アーカイブ**です。実装済みコンポーネントは以下の独立リポジトリで管理されています：

| コンポーネント | 説明 | リポジトリ |
|-------------|------|-----------|
| **FxRate** | 為替レート検索・換算 LWC | [yumi1101/FxRate](https://github.com/yumi1101/FxRate) |
| **ActivityHeatMap** | 活動履歴ヒートマップ表示 LWC | [yumi1101/ActivityHeatMap](https://github.com/yumi1101/ActivityHeatMap) |
| **ZipcodeAutoFill** | 郵便番号→住所自動入力 LWC | [yumi1101/ZipcodeAutoFill](https://github.com/yumi1101/ZipcodeAutoFill) |

## 📚 このリポジトリについて

- **用途:** LWC 開発の学習記録・アーカイブ
- **デプロイ対象:** ❌ このリポジトリは本番デプロイ不可
- **参考情報:** 各コンポーネントの実装例・ベストプラクティス

## 🚀 コンポーネント利用方法

各コンポーネントを Salesforce org にデプロイしたい場合は、**独立リポジトリ** をクローンしてください：

### FxRate（為替レート検索・換算）
```bash
git clone https://github.com/yumi1101/FxRate.git
cd FxRate
sfdx force:source:deploy -p force-app -u your-org
```

### ActivityHeatMap（活動履歴ヒートマップ）
```bash
git clone https://github.com/yumi1101/ActivityHeatMap.git
cd ActivityHeatMap
sfdx force:source:deploy -p force-app -u your-org
```

### ZipcodeAutoFill（郵便番号→住所自動入力）
```bash
git clone https://github.com/yumi1101/ZipcodeAutoFill.git
cd ZipcodeAutoFill
sfdx force:source:deploy -p force-app -u your-org
```

## 📖 Salesforce DX ドキュメント

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)

## 📝 ライセンス

MIT License

## 作成者

yumi1101
