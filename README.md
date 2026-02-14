# LWCworking - Salesforce LWC コンポーネント群（統合プロジェクト）

Salesforce Lightning Web Component（LWC）開発の統合プロジェクトです。複数の独立したコンポーネントを1つのリポジトリで管理・開発します。

## 📦 含まれるコンポーネント

このプロジェクトには以下の 3 つのコンポーネントが含まれています。各コンポーネントは `components/` ディレクトリ配下に独立したディレクトリとして管理されています。

### 1️⃣ FxRate（為替レート検索・換算）
**パス:** `components/FxRate/`

複数の通貨に対応した為替レート取得・換算機能を提供するコンポーネントです。
- **Apex:** `FxRateService.cls`, `FxRateServiceTest.cls`
- **LWC:** `fxRatePanel`
- **外部API:** Frankfurter API（https://api.frankfurter.dev）
- **対応通貨:** USD, JPY, EUR, GBP, AUD, CAD, CHF, CNY, HKD, SGD, NZD, SEK, NOK, DKK, KRW, INR, MXN, BRL, ZAR

詳細は `components/FxRate/README.md` を参照。

### 2️⃣ ActivityHeatMap（活動履歴ヒートマップ表示）
**パス:** `components/ActivityHeatMap/`

ユーザーの活動履歴を可視化するヒートマップ表示コンポーネントです。
- **Apex:** `ActivityHeatMapController.cls`
- **LWC:** `activityHeatMap`
- **機能:** カレンダー形式でのヒートマップ表示、日ごとのアクティビティ集計

詳細は `components/ActivityHeatMap/README.md` を参照。

### 3️⃣ ZipcodeAutoFill（郵便番号→住所自動入力）
**パス:** `components/ZipcodeAutoFill/`

郵便番号を入力することで、該当する住所を自動入力するコンポーネントです。
- **Apex:** `ZipcodeLookupService.cls`
- **LWC:** `zipcodeAutoFill`
- **外部API:** ZipCloud API（公開API）
- **機能:** 複数候補対応、Debounce処理、手動編集可能

詳細は `components/ZipcodeAutoFill/README.md` を参照。

---

## 📂 プロジェクト構造

```
yumiProject/
├── force-app/                  # メイン Salesforce DX ソースコード
│   └── main/default/
│       ├── classes/            # Apex クラス（ユーティリティ等）
│       ├── lwc/                # LWC コンポーネント（メイン）
│       └── ...
├── components/                 # 独立したコンポーネント群
│   ├── FxRate/
│   │   ├── force-app/
│   │   ├── README.md
│   │   ├── sfdx-project.json
│   │   └── .git/
│   ├── ActivityHeatMap/
│   │   ├── force-app/
│   │   ├── README.md
│   │   ├── sfdx-project.json
│   │   └── .git/
│   └── ZipcodeAutoFill/
│       ├── force-app/
│       ├── README.md
│       ├── sfdx-project.json
│       └── .git/
├── config/                     # Salesforce DX 設定
├── CompanySuggestPanel/        # その他のサブプロジェクト
├── README.md                   # このファイル
├── sfdx-project.json
└── .git/                       # メインリポジトリ
```

---

## 🚀 セットアップ・デプロイ

### 前提条件
- Salesforce 組織へのアクセス権
- Salesforce CLI がインストール済み

### 1. リポジトリをクローン
```bash
git clone https://github.com/yumi1101/LWCworking.git
cd LWCworking
```

### 2. Salesforce 組織を認可
```bash
sfdx auth:web:login -a your-org-alias
```

### 3. メインプロジェクトをデプロイ
```bash
sf project deploy start -d force-app -o your-org-alias
```

### 4. 個別コンポーネントをデプロイ（オプション）
各コンポーネントは独立したリポジトリでもあり、個別にデプロイ可能です：

```bash
# FxRate をデプロイ
cd components/FxRate
sf project deploy start -d force-app -o your-org-alias

# ActivityHeatMap をデプロイ
cd components/ActivityHeatMap
sf project deploy start -d force-app -o your-org-alias

# ZipcodeAutoFill をデプロイ
cd components/ZipcodeAutoFill
sf project deploy start -d force-app -o your-org-alias
```

---

## 📖 各コンポーネントの詳細

| コンポーネント | ローカルパス | GitHub リポジトリ | README |
|-----------|-----------|------------------|-------|
| **FxRate** | `components/FxRate/` | [yumi1101/FxRate](https://github.com/yumi1101/FxRate) | [FxRate README](components/FxRate/README.md) |
| **ActivityHeatMap** | `components/ActivityHeatMap/` | [yumi1101/ActivityHeatMap](https://github.com/yumi1101/ActivityHeatMap) | [ActivityHeatMap README](components/ActivityHeatMap/README.md) |
| **ZipcodeAutoFill** | `components/ZipcodeAutoFill/` | [yumi1101/ZipcodeAutoFill](https://github.com/yumi1101/ZipcodeAutoFill) | [ZipcodeAutoFill README](components/ZipcodeAutoFill/README.md) |

---

## 🔄 マルチリポジトリ戦略

このプロジェクトは以下の戦略を採用しています：

1. **統合管理:** メインリポジトリ（LWCworking）でプロジェクト全体を管理
2. **独立性:** 各コンポーネントは `components/` 配下で独立した Git リポジトリ
3. **再利用性:** 各コンポーネントは単独でも GitHub から clone・利用可能
4. **開発効率:** メインプロジェクトからすべてのコンポーネントを一括管理・デプロイ

---

## 🧪 テスト

各コンポーネントのテストを実行：

```bash
# FxRate のテスト
cd components/FxRate
sfdx force:apex:test:run -u your-org-alias

# 他のコンポーネントも同様
```

---

## 📋 開発ワークフロー

1. コンポーネントの新機能・バグ修正は該当ディレクトリで開発
2. テストを実行して動作確認
3. コミット・プッシュ
4. メインリポジトリに反映

---

## 🔗 関連リンク

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)

---

## 📝 ライセンス

MIT License

---

## 作成者

yumi1101
