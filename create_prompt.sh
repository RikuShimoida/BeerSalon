#!/bin/bash
set -euo pipefail

# スクリプトの場所を基準にしたパス
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/prompt_to_claude.txt"

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 複数行入力を受け取る関数
read_multiline() {
    local prompt="$1"
    local is_optional="${2:-false}"
    local result=""

    echo -e "${BLUE}${prompt}${NC}" >&2
    if [ "$is_optional" = "true" ]; then
        echo -e "${YELLOW}（複数行入力可能。空行で入力を終了します。Enterでスキップ可）${NC}" >&2
    else
        echo -e "${YELLOW}（複数行入力可能。空行で入力を終了します）${NC}" >&2
    fi

    while IFS= read -r line; do
        if [ -z "$line" ]; then
            break
        fi
        if [ -z "$result" ]; then
            result="$line"
        else
            result="$result
$line"
        fi
    done

    echo "$result"
}

# 必須項目の単一行入力を受け取る関数
read_required() {
    local prompt="$1"
    local result=""

    while true; do
        echo -e -n "${BLUE}${prompt}${NC}" >&2
        read -r result
        if [ -n "$result" ]; then
            echo "$result"
            return 0
        fi
        echo -e "${YELLOW}この項目は必須です。入力してください。${NC}" >&2
    done
}

# 選択肢から選ぶ関数
select_option() {
    local prompt="$1"
    shift
    local options=("$@")

    echo -e "${BLUE}${prompt}${NC}" >&2
    for i in "${!options[@]}"; do
        echo "$((i+1)). ${options[$i]}" >&2
    done

    while true; do
        read -p "選択してください (1-${#options[@]}): " choice
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#options[@]}" ]; then
            echo "${choice}|${options[$((choice-1))]}"
            return 0
        else
            echo -e "${YELLOW}無効な選択です。1-${#options[@]}の範囲で選択してください。${NC}" >&2
        fi
    done
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Claude Code プロンプト作成スクリプト${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. 対応種別
type_options=("機能追加" "バグ修正" "レイアウト変更" "アーキテクチャ変更")
result=$(select_option "★対応種別を選択してください:" "${type_options[@]}")
type_choice=$(echo "$result" | cut -d'|' -f1)
selected_type=$(echo "$result" | cut -d'|' -f2)

case $type_choice in
    1) type_text="機能追加についての要件です。" ;;
    2) type_text="バグ修正についての要件です。" ;;
    3) type_text="レイアウト変更についての要件です。" ;;
    4) type_text="アーキテクチャ変更についての要件です。" ;;
esac

echo ""

# 2. Claude codeに担わせる役割
role_options=("プロのシステム設計者" "プロのバックエンドエンジニア" "プロのフロントエンドエンジニア" "プロのUIデザイナー" "プロのインフラエンジニア" "プロのQAエンジニア" "プロのシステムアーキテクト" "プロのセキュリティエンジニア" "その他(フリーテキスト)")
result=$(select_option "★Claude codeに担わせる役割を選択してください:" "${role_options[@]}")
role_choice=$(echo "$result" | cut -d'|' -f1)
selected_role=$(echo "$result" | cut -d'|' -f2)

if [ "$role_choice" -eq 9 ]; then
    custom_role=$(read_required "役割を入力してください: ")
    role_text="あなたはBeer Salonのドメインを熟知した${custom_role}です。"
else
    role_text="あなたはBeer Salonのドメインを熟知した${selected_role}です。"
fi

echo ""

# 3. 対象システム名
system_options=("ユーザー画面" "管理画面" "両方")
result=$(select_option "★対象システム名を選択してください:" "${system_options[@]}")
system_choice=$(echo "$result" | cut -d'|' -f1)
selected_system=$(echo "$result" | cut -d'|' -f2)

case $system_choice in
    1) system_text="ユーザー画面について" ;;
    2) system_text="管理画面について" ;;
    3) system_text="ユーザー画面と管理画面について" ;;
esac

echo ""

# 4. 対象ページ名
page_name=$(read_required "★対象ページ名を入力してください: ")
echo ""

# 5. 対象機能名
feature_name=$(read_required "★対象機能名を入力してください: ")
echo ""

# 6. 課題
issue=$(read_multiline "★課題を入力してください:")
echo ""

# 7. 期待する状態
expected=$(read_multiline "★期待する状態を入力してください:")
echo ""

# 8. なぜそれをやるのか？
reason=$(read_multiline "★なぜそれをやるのか？を入力してください:")
echo ""

# 9. やらないこと（オプション）
not_do=$(read_multiline "やらないことを入力してください（オプション）:" "true")
echo ""

# 10. 受入条件
acceptance=$(read_multiline "★受入条件を入力してください:")
echo ""

# 11. 前提条件（オプション）
prerequisites=$(read_multiline "前提条件を入力してください（オプション）:" "true")
echo ""

# 12. 補足（オプション）
notes=$(read_multiline "補足（考えられる原因など）を入力してください（オプション）:" "true")
echo ""

# 確認画面
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}入力内容の確認${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}対応種別:${NC} ${selected_type}"
echo -e "${BLUE}役割:${NC} ${role_text}"
echo -e "${BLUE}対象システム:${NC} ${system_text}"
echo -e "${BLUE}対象ページ:${NC} ${page_name}"
echo -e "${BLUE}対象機能:${NC} ${feature_name}"
echo -e "${BLUE}課題:${NC}"
echo "$issue"
echo ""
echo -e "${BLUE}期待する状態:${NC}"
echo "$expected"
echo ""
echo -e "${BLUE}なぜそれをやるのか？:${NC}"
echo "$reason"
echo ""
if [ -n "$not_do" ]; then
    echo -e "${BLUE}やらないこと:${NC}"
    echo "$not_do"
    echo ""
fi
echo -e "${BLUE}受入条件:${NC}"
echo "$acceptance"
echo ""
if [ -n "$prerequisites" ]; then
    echo -e "${BLUE}前提条件:${NC}"
    echo "$prerequisites"
    echo ""
fi
if [ -n "$notes" ]; then
    echo -e "${BLUE}補足:${NC}"
    echo "$notes"
    echo ""
fi
echo -e "${GREEN}========================================${NC}"
echo ""

read -p "この内容でプロンプトを作成しますか？ (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo -e "${YELLOW}キャンセルしました${NC}"
    exit 0
fi

# プロンプトを構築（ヒアドキュメント使用）
prompt=$(cat <<EOF
${type_text}
${role_text}

${system_text}

## 対象ページ
${page_name}

## 対象機能
${feature_name}

## 課題
${issue}

## 期待する状態
${expected}

## なぜそれをやるのか？
${reason}
EOF
)

if [ -n "$not_do" ]; then
    prompt="${prompt}

## やらないこと
${not_do}"
fi

prompt="${prompt}

## 受入条件
${acceptance}"

if [ -n "$prerequisites" ]; then
    prompt="${prompt}

## 前提条件
${prerequisites}"
fi

if [ -n "$notes" ]; then
    prompt="${prompt}

## 補足
${notes}"
fi

# 対応種別に応じた固定文を追加
if [ $type_choice -eq 1 ]; then
    # 機能追加の場合
    prompt="${prompt}

---

@routing.md
@wireframe.md
@database.md
@README.md
を参照して、
GitHub Issueテンプレ
@.github/ISSUE_TEMPLATE/feature.md
に従って、gh コマンドを使ってIssueを作成してください。
受入条件はPlaywrightで検証できる形で記載してください。"
elif [ $type_choice -eq 2 ]; then
    # バグ修正の場合
    prompt="${prompt}

---

@routing.md
@wireframe.md
@database.md
@README.md
を参照して、
GitHub Issueテンプレ
@.github/ISSUE_TEMPLATE/bugfix.md
に従って、gh コマンドを使ってIssueを作成してください。
受入条件はPlaywrightで検証できる形で記載してください。"
else
    # レイアウト変更、アーキテクチャ変更の場合は機能追加と同じテンプレートを使用
    prompt="${prompt}

---

@routing.md
@wireframe.md
@database.md
@README.md
を参照して、
GitHub Issueテンプレ
@.github/ISSUE_TEMPLATE/feature.md
に従って、gh コマンドを使ってIssueを作成してください。
受入条件はPlaywrightで検証できる形で記載してください。"
fi

# prompt_to_claude.txtに追加（エラーハンドリング付き）
{
    echo ""
    echo "========================================"
    echo "作成日時: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"
    echo "$prompt"
    echo ""
} >> "$OUTPUT_FILE" 2>/dev/null || {
    echo -e "${RED}エラー: ${OUTPUT_FILE} への書き込みに失敗しました${NC}" >&2
    echo -e "${RED}ファイルの権限を確認してください${NC}" >&2
    exit 1
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}プロンプトの作成が完了しました。${NC}"
echo -e "${GREEN}内容は ${OUTPUT_FILE} に追加しました。${NC}"
echo -e "${GREEN}========================================${NC}"
