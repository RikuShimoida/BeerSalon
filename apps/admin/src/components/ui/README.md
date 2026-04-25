# UI Components

このディレクトリには、BeerSalonAdminアプリケーション全体で使用される再利用可能なUIコンポーネントが含まれています。

## コンポーネント一覧

### Button

ボタンコンポーネント。複数のバリアントとサイズをサポートしています。

```tsx
import { Button } from '@/components/ui';

// 基本的な使い方
<Button onClick={handleClick}>クリック</Button>

// バリアント
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// サイズ
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// ローディング状態
<Button isLoading>Processing...</Button>

// フルワイズ
<Button fullWidth>Full Width Button</Button>
```

### Input

入力フィールドコンポーネント。ラベル、エラー表示、ヘルパーテキストをサポートしています。

```tsx
import { Input } from '@/components/ui';

<Input
  label="メールアドレス"
  type="email"
  placeholder="email@example.com"
  required
  fullWidth
/>

// エラー表示
<Input
  label="パスワード"
  type="password"
  error="パスワードは8文字以上である必要があります"
/>

// ヘルパーテキスト
<Input
  label="ユーザー名"
  helperText="3〜20文字の英数字"
/>
```

### Select

セレクトボックスコンポーネント。

```tsx
import { Select } from '@/components/ui';

const options = [
  { value: 'active', label: 'アクティブ' },
  { value: 'inactive', label: '非アクティブ' },
];

<Select
  label="ステータス"
  options={options}
  placeholder="選択してください"
  fullWidth
/>
```

### Textarea

テキストエリアコンポーネント。

```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="説明"
  rows={4}
  placeholder="詳細な説明を入力してください"
  fullWidth
/>

// エラー表示
<Textarea
  label="コメント"
  error="コメントは必須です"
/>
```

### Modal

モーダルダイアログコンポーネント。

```tsx
import { Modal } from '@/components/ui';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="確認"
  size="md"
>
  <p>本当に削除しますか？</p>
  <div className="mt-4 flex justify-end gap-2">
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      キャンセル
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      削除
    </Button>
  </div>
</Modal>
```

サイズオプション: `sm`, `md`, `lg`, `xl`

### Loading

ローディングスピナーコンポーネント。

```tsx
import { Loading } from '@/components/ui';

// 基本的な使い方
<Loading />

// サイズ指定
<Loading size="sm" />
<Loading size="md" />
<Loading size="lg" />

// テキスト付き
<Loading text="読み込み中..." />

// フルスクリーン
<Loading fullScreen text="処理中です..." />
```

### Alert

アラート/通知コンポーネント。

```tsx
import { Alert } from '@/components/ui';

// 成功
<Alert variant="success" title="成功">
  データが正常に保存されました。
</Alert>

// エラー
<Alert variant="error" title="エラー">
  処理中にエラーが発生しました。
</Alert>

// 警告
<Alert variant="warning" title="警告">
  この操作は取り消せません。
</Alert>

// 情報
<Alert variant="info" title="お知らせ">
  メンテナンスのお知らせ
</Alert>

// 閉じるボタン付き
<Alert variant="info" onClose={() => console.log('closed')}>
  閉じることができます
</Alert>
```

### Card

カードコンポーネント。コンテンツをグループ化するために使用します。

```tsx
import { Card } from '@/components/ui';

// 基本的な使い方
<Card>
  <p>カードの内容</p>
</Card>

// タイトル付き
<Card title="ユーザー情報">
  <p>ユーザーの詳細情報</p>
</Card>

// サブタイトル付き
<Card title="統計情報" subtitle="過去30日間のデータ">
  <p>統計データ</p>
</Card>

// フッター付き
<Card
  title="設定"
  footer={
    <Button>保存</Button>
  }
>
  <p>設定内容</p>
</Card>

// パディングなし（テーブルなどに使用）
<Card title="ユーザー一覧" noPadding>
  <table>...</table>
</Card>
```

## 使用例

### フォームの例

```tsx
import { Input, Select, Textarea, Button, Card } from '@/components/ui';
import { useState } from 'react';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    bio: '',
  });

  const roleOptions = [
    { value: 'admin', label: '管理者' },
    { value: 'bar_owner', label: 'バーオーナー' },
  ];

  return (
    <Card title="ユーザー登録">
      <form className="space-y-4">
        <Input
          label="名前"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          fullWidth
        />
        <Input
          label="メールアドレス"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          fullWidth
        />
        <Select
          label="役割"
          options={roleOptions}
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="役割を選択"
          required
          fullWidth
        />
        <Textarea
          label="自己紹介"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          fullWidth
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary">
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            登録
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

### モーダル確認ダイアログの例

```tsx
import { Button, Modal, Alert } from '@/components/ui';
import { useState } from 'react';

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    // 削除処理
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        削除
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="削除確認"
        size="sm"
      >
        <Alert variant="warning">
          この操作は取り消せません。本当に削除しますか？
        </Alert>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            削除する
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

## スタイリング

すべてのコンポーネントはTailwind CSSを使用してスタイリングされています。必要に応じて`className` propを使用して追加のスタイルを適用できます。

## アクセシビリティ

- すべてのフォーム要素にはラベルが関連付けられています
- モーダルはEscキーで閉じることができます
- ボタンは無効化時に適切なARIA属性を持ちます
- フォーカス状態が視覚的に明確です

## 型安全性

すべてのコンポーネントはTypeScriptで記述されており、適切な型定義を提供しています。IDEの自動補完とタイプチェックを活用できます。
