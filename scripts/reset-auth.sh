#!/bin/bash

echo "🔄 認証データを完全にリセットします..."

# Supabase を再起動
echo "1. Supabase を再起動中..."
supabase stop
supabase start

# すべてのユーザーを削除するSQLを実行
echo "2. 既存ユーザーを削除中..."
docker exec supabase_db_BeerSalon psql -U postgres -d postgres -c "DELETE FROM auth.users; DELETE FROM auth.sessions; DELETE FROM auth.refresh_tokens;"

echo "✅ リセット完了！"
echo ""
echo "次の手順:"
echo "1. ブラウザのシークレットモードを開く"
echo "2. http://localhost:3000/signup にアクセス"
echo "3. 新しいメールアドレス（例: newtest@example.com）で登録"
echo "4. ターミナルのログを確認"
echo ""
echo "期待される動作:"
echo "- 'Session: NULL (正常)' が表示される"
echo "- '確認メールを送信しました' ページが表示される"
echo "- http://127.0.0.1:54324 に確認メールが届く"
