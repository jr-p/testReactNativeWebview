# testReactNativeWebview - Bluetooth温度設定アプリ

React Nativeで開発されたBluetooth Low Energy（BLE）を使用した温度設定アプリです。特定のBLEデバイスに接続し、温度パラメータを16bitで書き込むことができます。

## 🚀 アプリ概要

このアプリは以下の機能を提供します：

- **BLEデバイス検索・接続**: 指定したデバイス名でBLEデバイスをスキャン・接続
- **温度設定**: BLEキャラクタリスティックを通じて温度値を設定
- **権限管理**: Android API レベルに応じた適切な権限リクエスト
- **リアルタイム状態表示**: 接続状況や操作の詳細をリアルタイムで表示

### 対応デバイス
- **対象BLEデバイス**: DNSMRA030003473（デフォルト、変更可能）
- **サービスUUID**: `442f1570-8a00-9a28-cbe1-e1d4212d53eb`
- **キャラクタリスティックUUID**: `442f1574-8a00-9a28-cbe1-e1d4212d53eb`

## 🛠 技術スタック

- **React Native**: 0.80.2
- **React**: 19.1.0
- **TypeScript**: 5.0.4
- **React Native BLE PLX**: 3.5.0（Bluetooth通信）

### 開発ツール
- **Node.js**: >=18
- **ESLint**: コード品質管理
- **Jest**: テストフレームワーク
- **Prettier**: コードフォーマット

## 📋 必要な環境

### 基本要件
- **Node.js**: 18以上
- **React Native CLI**
- **Android Studio**（Androidビルド用）
- **Xcode**（iOSビルド用、macOSのみ）

### Android要件
- **Android SDK**: API 21以上
- **Java/Kotlin**: 開発言語サポート
- **Bluetooth LE対応デバイス**

### iOS要件
- **iOS**: 10.0以上
- **Xcode**: 最新版推奨

## ⚡️ クイックスタート

### 1. プロジェクトのクローンと依存関係のインストール

```bash
# プロジェクトディレクトリに移動
cd testReactNativeWebview

# 依存関係をインストール
yarn install
# または
npm install

# iOSの場合、Podもインストール
cd ios && pod install && cd ..
```

### 2. 開発サーバーの起動

```bash
# Metro bundlerを起動
yarn start
# または
npm start
```

### 3. アプリの実行

```bash
# Android
yarn android
# または
npm run android

# iOS
yarn ios
# または  
npm run ios
```

## 🔧 環境構築詳細

### Android環境構築

#### 1. Android Studioのセットアップ
```bash
# Android SDKパスを確認・設定
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 2. 権限設定
アプリは以下の権限を自動的にリクエストします：

**Android 10-11 (API 29-30):**
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

**Android 12+ (API 31+):**
- `BLUETOOTH_SCAN`
- `BLUETOOTH_CONNECT` 
- `BLUETOOTH_ADVERTISE`

#### 3. Manifest設定
`android/app/src/main/AndroidManifest.xml`に必要な権限とBLE機能が設定済みです：

```xml
<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" 
    android:usesPermissionFlags="neverForLocation" />
```

### iOS環境構築

#### 1. Xcode設定
- Xcodeで`ios/testReactNativeWebview.xcworkspace`を開く
- 適切な開発者アカウントでサイニング設定

#### 2. Info.plist設定
BLE使用のためのプライバシー設定が含まれています。

## 📱 アプリの使い方

### 基本操作

1. **アプリを起動**
2. **端末名を入力**（デフォルト: DNSMRA030003473）
3. **設定温度を入力**（数値）
4. **「温度を変更」ボタンをタップ**
5. **接続状況を確認**（下部のステータス表示で確認）

### BLE接続フロー

1. **権限確認**: Android APIレベルに応じた権限を自動取得
2. **Bluetooth状態確認**: Bluetoothの有効状態をチェック
3. **デバイススキャン**: 15秒間のデバイス検索
4. **接続実行**: 対象デバイスへの接続
5. **サービス検出**: BLEサービス・キャラクタリスティックの取得
6. **温度書き込み**: 16bitデータでの温度設定
7. **切断**: 処理完了後の自動切断

### 温度計算ロジック

```typescript
// 温度値の計算方式
const temperatureValue = parseInt(temperature, 10);
const tempOffset = -30;
const tempByte = temperatureValue - tempOffset + 1;

// 16bitデータ作成
const byte0 = 0x02;
const byte1 = tempByte;
const valueToWrite = (byte0 << 8) | byte1;
```

## 🔨 ビルドとデプロイ

### 開発ビルド

```bash
# Android開発ビルド
yarn android

# iOS開発ビルド  
yarn ios
```

### プロダクションビルド

#### Android APK生成

```bash
# リリースAPKをビルド
cd android
./gradlew assembleRelease
```

**生成されるAPKファイル:**
- `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk` (15MB)
- `android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk` (12MB)

#### iOS App Store用ビルド

```bash
# iOSリリースビルド
yarn ios --configuration=Release
```

### APK最適化設定

以下の最適化が適用済みです：

1. **Proguard有効化** - コードの難読化・最適化
2. **リソース圧縮** - 未使用リソースの自動削除  
3. **APK分割** - CPU アーキテクチャ別APK生成
4. **R8最適化** - より高度なコード最適化

設定詳細:
```gradle
// android/app/build.gradle
def enableProguardInReleaseBuilds = true

splits {
    abi {
        enable true
        include "armeabi-v7a", "arm64-v8a"
        universalApk false
    }
}

release {
    minifyEnabled enableProguardInReleaseBuilds
    shrinkResources true
    proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
}
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. 権限エラー
```
権限エラー: Bluetooth使用に必要な権限が許可されていません
```
**解決方法**: 設定 → アプリ → 権限から位置情報・Bluetooth権限を手動で有効化

#### 2. Bluetoothエラー
```  
Bluetoothが無効です
```
**解決方法**: デバイス設定でBluetoothを有効にする

#### 3. デバイスが見つからない
```
デバイスが見つかりませんでした
```
**確認事項**:
- BLEデバイスの電源ON確認
- デバイス名の正確性確認  
- ペアリング待機状態の確認
- 近距離（1-2m以内）での実行

#### 4. ビルドエラー

**Android:**
```bash
# クリーンビルド実行
cd android
./gradlew clean
./gradlew assembleRelease
```

**iOS:**
```bash
# キャッシュクリア
cd ios
rm -rf build/
pod clean
pod install
```

#### 5. Metro bundlerエラー
```bash
# キャッシュクリア
yarn start --reset-cache
```

## 🧪 テスト

```bash
# 全テスト実行
yarn test

# watchモードでテスト
yarn test --watch

# カバレッジレポート生成
yarn test --coverage
```

## 📄 プロジェクト構造

```
testReactNativeWebview/
├── App.tsx                     # メインアプリコンポーネント
├── package.json                # 依存関係とスクリプト
├── android/                    # Android固有設定
│   ├── app/
│   │   ├── build.gradle        # ビルド設定（最適化済み）
│   │   ├── proguard-rules.pro  # Proguardルール
│   │   └── src/main/
│   │       └── AndroidManifest.xml  # 権限・機能設定
├── ios/                        # iOS固有設定
├── node_modules/               # 依存ライブラリ
├── __tests__/                  # テストファイル
├── ble_mobico_sample.html      # Web Bluetooth参考実装
└── README.md                   # このファイル
```

## 🤝 開発への貢献

### 開発フロー

1. **フォークとクローン**
2. **フィーチャーブランチ作成**
3. **変更の実装**
4. **テスト実行**
5. **プルリクエスト作成**

### コードスタイル

```bash
# ESLintでコード品質チェック
yarn lint

# Prettierでフォーマット
yarn format
```

## 📚 参考資料

- [React Native公式ドキュメント](https://reactnative.dev/)
- [React Native BLE PLX](https://github.com/Polidea/react-native-ble-plx)
- [Android Bluetooth権限ガイド](https://developer.android.com/guide/topics/connectivity/bluetooth/permissions)
- [iOS Core Bluetooth](https://developer.apple.com/documentation/corebluetooth)

## 📝 ライセンス

このプロジェクトは Private ライセンスの下で提供されています。

## 📞 サポート

問題や質問がある場合は、プロジェクトの Issue または開発チームまでお問い合わせください。

---

**最終更新**: 2025年8月28日
**Version**: 0.0.1