# E2Eテストガイド

BeerSalonAdmin の Playwright E2Eテストドキュメント

## 概要

このプロジェクトでは、[Playwright](https://playwright.dev/)を使用してE2Eテストを実装しています。Playwrightは、Chromium、Firefox、WebKitをサポートする強力なブラウザ自動化ツールです。

## セットアップ

### 初回セットアップ

```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール
npx playwright install
```

## テストの実行

### すべてのテストを実行

```bash
npm test
```

### UIモードで実行（推奨）

UIモードでは、テストの実行状況を視覚的に確認でき、デバッグが容易です。

```bash
npm run test:ui
```

### 特定のテストファイルを実行

```bash
npx playwright test tests/auth.spec.ts
```

### ヘッドレスモードで実行

```bash
npx playwright test --headed
```

### デバッグモード

```bash
npx playwright test --debug
```

### レポートの表示

テスト実行後、HTMLレポートを表示できます。

```bash
npm run test:report
```

## テスト構成

### ディレクトリ構造

```
tests/
├── helpers/          # テストヘルパー関数
│   ├── auth.ts      # 認証関連ヘルパー
│   └── fixtures.ts  # カスタムフィクスチャ
├── auth.spec.ts     # 認証テスト
├── dashboard.spec.ts # ダッシュボードテスト
├── bars.spec.ts     # バー管理テスト
└── README.md        # このファイル
```

### テストヘルパー

#### 認証ヘルパー (`helpers/auth.ts`)

認証関連の共通処理を提供します。

```typescript
import { login, loginAsAdmin, loginAsBarOwner, logout } from './helpers/auth';

// バーオーナーとしてログイン
await loginAsBarOwner(page);

// 管理者としてログイン
await loginAsAdmin(page);

// ログアウト
await logout(page);
```

#### カスタムフィクスチャ (`helpers/fixtures.ts`)

認証済みページのフィクスチャを提供します。

```typescript
import { test, expect } from './helpers/fixtures';

test('should access protected page', async ({ authenticatedPage }) => {
  // 既に認証済みのページが使用できる
  await authenticatedPage.goto('/dashboard');
});

test('admin only feature', async ({ adminPage }) => {
  // 管理者として認証済み
  await adminPage.goto('/admin/users');
});

test('bar owner feature', async ({ barOwnerPage }) => {
  // バーオーナーとして認証済み
  await barOwnerPage.goto('/bars');
});
```

## テストの書き方

### 基本的なテスト

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page');
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

### 認証が必要なテスト

```typescript
import { test, expect } from './helpers/fixtures';

test.describe('Protected Feature', () => {
  test('should access after login', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/protected-page');
    // テストコード
  });
});
```

### 役割別のテスト

```typescript
import { test, expect } from './helpers/fixtures';

test.describe('Admin Features', () => {
  test('admin can manage users', async ({ adminPage }) => {
    await adminPage.goto('/admin/users');
    await expect(adminPage.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible();
  });
});

test.describe('Bar Owner Features', () => {
  test('bar owner can manage bars', async ({ barOwnerPage }) => {
    await barOwnerPage.goto('/bars');
    await expect(barOwnerPage.getByRole('heading', { name: 'バー一覧' })).toBeVisible();
  });
});
```

## テストユーザー

テストでは以下のユーザーを使用します（データベースに存在する必要があります）：

### 管理者
- **メールアドレス**: admin@example.com
- **パスワード**: password123
- **役割**: admin

### バーオーナー
- **メールアドレス**: owner@example.com
- **パスワード**: password123
- **役割**: bar_owner

## ベストプラクティス

### 1. セレクタの優先順位

推奨される順序でセレクタを使用してください：

1. **Role selectors** (推奨)
   ```typescript
   page.getByRole('button', { name: 'ログイン' })
   ```

2. **Label selectors**
   ```typescript
   page.getByLabel('メールアドレス')
   ```

3. **Text selectors**
   ```typescript
   page.getByText('エラーメッセージ')
   ```

4. **Test ID** (最終手段)
   ```typescript
   page.getByTestId('submit-button')
   ```

### 2. テストの独立性

各テストは独立して実行できるようにしてください。

```typescript
// ❌ 悪い例：前のテストに依存
test('create bar', async ({ page }) => { /* ... */ });
test('edit bar', async ({ page }) => { /* 前のテストで作成されたバーに依存 */ });

// ✅ 良い例：各テストが独立
test('create bar', async ({ page }) => { /* ... */ });
test('edit bar', async ({ page }) => {
  // テスト内でバーを作成
  await createTestBar();
  // 編集テスト
});
```

### 3. 明示的な待機

暗黙的な待機を避け、明示的な待機を使用してください。

```typescript
// ❌ 悪い例
await page.click('button');
await page.waitForTimeout(1000); // 固定時間の待機

// ✅ 良い例
await page.click('button');
await page.waitForURL('/dashboard'); // URLの変更を待つ
await expect(page.getByText('成功')).toBeVisible(); // 要素の表示を待つ
```

### 4. クリーンアップ

テスト後のクリーンアップが必要な場合は、`test.afterEach`を使用してください。

```typescript
test.afterEach(async ({ page }) => {
  // テストデータのクリーンアップ
});
```

## デバッグ

### スクリーンショット

失敗時に自動的にスクリーンショットが保存されます（`playwright.config.ts`で設定済み）。

### トレース

失敗時のトレースを確認：

```bash
npx playwright show-trace trace.zip
```

### ステップバイステップ実行

```bash
npx playwright test --debug
```

## CI/CD

### GitHub Actions

CI環境では自動的に以下の設定が適用されます：

- リトライ: 2回
- 並列実行: 無効（workers: 1）
- ヘッドレスモード: 有効

```yaml
- name: Run Playwright tests
  run: npm test
```

## トラブルシューティング

### テストが失敗する

1. **開発サーバーが起動しているか確認**
   ```bash
   npm run dev
   ```

2. **データベースが正しくセットアップされているか確認**
   - テストユーザーが存在するか
   - マイグレーションが実行されているか

3. **Playwrightブラウザが最新か確認**
   ```bash
   npx playwright install
   ```

### タイムアウトエラー

`playwright.config.ts`でタイムアウト設定を調整できます：

```typescript
export default defineConfig({
  timeout: 30000, // テスト全体のタイムアウト
  expect: {
    timeout: 5000, // アサーションのタイムアウト
  },
});
```

## 参考リソース

- [Playwright 公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

## 今後の拡張

以下の機能を追加予定：

- [ ] ビジュアルリグレッションテスト
- [ ] パフォーマンステスト
- [ ] アクセシビリティテスト
- [ ] モバイルブラウザのテスト
- [ ] API テスト

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-02-09 | 初版作成、テストヘルパーとフィクスチャ追加 |
