#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/issue_note.txt"

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 結果格納用グローバル変数（コマンド置換によるサブシェル化を回避するため）
REPLY_VALUE=""
REPLY_CHOICE=""
REPLY_LABEL=""

# 入力ソース決定：TTYに対話的にアクセスできる場合のみ /dev/tty、それ以外は標準入力
if { true >/dev/tty; } 2>/dev/null && [ -t 1 -o -t 2 ]; then
    INPUT_SRC="/dev/tty"
else
    INPUT_SRC="/dev/stdin"
fi

# 複数行入力を受け取る関数（結果は REPLY_VALUE に格納）
read_multiline() {
    local prompt="$1"
    local is_optional="${2:-false}"
    local result=""
    local line=""

    echo -e "${BLUE}${prompt}${NC}" >&2
    if [ "$is_optional" = "true" ]; then
        echo -e "${YELLOW}（複数行入力可能。空行で入力を終了します。Enterでスキップ可）${NC}" >&2
    else
        echo -e "${YELLOW}（複数行入力可能。空行で入力を終了します）${NC}" >&2
    fi

    while IFS= read -er line <"$INPUT_SRC"; do
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

    REPLY_VALUE="$result"
}

# 必須の複数行入力を受け取る関数（結果は REPLY_VALUE に格納）
read_multiline_required() {
    local prompt="$1"

    while true; do
        read_multiline "$prompt"
        if [ -n "$REPLY_VALUE" ]; then
            return 0
        fi
        echo -e "${YELLOW}この項目は必須です。入力してください。${NC}" >&2
    done
}

# 必須項目の単一行入力を受け取る関数（結果は REPLY_VALUE に格納）
read_required() {
    local prompt="$1"
    local result=""

    while true; do
        echo -e -n "${BLUE}${prompt}${NC}" >&2
        IFS= read -er result <"$INPUT_SRC"
        if [ -n "$result" ]; then
            REPLY_VALUE="$result"
            return 0
        fi
        echo -e "${YELLOW}この項目は必須です。入力してください。${NC}" >&2
    done
}

# 選択肢から選ぶ関数（結果は REPLY_CHOICE と REPLY_LABEL に格納）
select_option() {
    local prompt="$1"
    shift
    local options=("$@")
    local choice=""

    echo -e "${BLUE}${prompt}${NC}" >&2
    for i in "${!options[@]}"; do
        echo "$((i+1)). ${options[$i]}" >&2
    done

    while true; do
        echo -e -n "${BLUE}選択してください (1-${#options[@]}): ${NC}" >&2
        IFS= read -er choice <"$INPUT_SRC"
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#options[@]}" ]; then
            REPLY_CHOICE="$choice"
            REPLY_LABEL="${options[$((choice-1))]}"
            return 0
        else
            echo -e "${YELLOW}無効な選択です。1-${#options[@]}の範囲で選択してください。${NC}" >&2
        fi
    done
}

# 課題No自動採番
if [ -f "$OUTPUT_FILE" ]; then
    last_issue_no=$(grep -o 'ISSUE-[0-9]*' "$OUTPUT_FILE" | sed 's/ISSUE-//' | sort -n | tail -1)
    if [ -n "$last_issue_no" ]; then
        next_no=$((10#$last_issue_no + 1))
    else
        next_no=1
    fi
else
    next_no=1
fi
issue_no=$(printf "ISSUE-%03d" "$next_no")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Beer Salon 課題管理表 作成スクリプト${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}課題No: ${issue_no}${NC}"
echo ""

# 1. 対応種別
type_options=("機能追加" "バグ修正" "レイアウト変更" "アーキテクチャ変更")
select_option "★対応種別を選択してください:" "${type_options[@]}"
type_choice="$REPLY_CHOICE"
selected_type="$REPLY_LABEL"

case $type_choice in
    1) type_text="機能追加についての要件です。" ;;
    2) type_text="バグ修正についての要件です。" ;;
    3) type_text="レイアウト変更についての要件です。" ;;
    4) type_text="アーキテクチャ変更についての要件です。" ;;
esac

echo ""

# 2. 対象システム名
system_options=("ユーザー画面" "管理画面" "両方")
select_option "★対象システム名を選択してください:" "${system_options[@]}"
system_choice="$REPLY_CHOICE"
selected_system="$REPLY_LABEL"

case $system_choice in
    1) system_text="ユーザー画面について" ;;
    2) system_text="管理画面について" ;;
    3) system_text="ユーザー画面と管理画面について" ;;
esac

echo ""

# 3. 対象ページ名
read_required "★対象ページ名を入力してください: "
page_name="$REPLY_VALUE"
echo ""

# 4. 対象機能名
read_required "★対象機能名を入力してください: "
feature_name="$REPLY_VALUE"
echo ""

# 5. 課題
read_multiline_required "★課題を入力してください:"
issue="$REPLY_VALUE"
echo ""

# 6. 期待する状態
read_multiline_required "★期待する状態を入力してください:"
expected="$REPLY_VALUE"
echo ""

# 7. なぜそれをやるのか？
read_multiline_required "★なぜそれをやるのか？を入力してください:"
reason="$REPLY_VALUE"
echo ""

# 8. やらないこと（オプション）
read_multiline "やらないことを入力してください（オプション）:" "true"
not_do="$REPLY_VALUE"
echo ""

# 9. 受入条件
read_multiline_required "★受入条件を入力してください:"
acceptance="$REPLY_VALUE"
echo ""

# 10. 前提条件（オプション）
read_multiline "前提条件を入力してください（オプション）:" "true"
prerequisites="$REPLY_VALUE"
echo ""

# 11. 補足（オプション）
read_multiline "補足（考えられる原因など）を入力してください（オプション）:" "true"
notes="$REPLY_VALUE"
echo ""

# 確認画面
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}入力内容の確認${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}課題No:${NC} ${issue_no}"
echo -e "${BLUE}対応種別:${NC} ${selected_type}"
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

echo -e -n "${BLUE}この内容で課題管理表に追加しますか？ (y/n): ${NC}"
IFS= read -er confirm <"$INPUT_SRC"
if [ "$confirm" != "y" ]; then
    echo -e "${YELLOW}キャンセルしました${NC}"
    exit 0
fi

# issue_note.txtに追記
{
    echo ""
    echo "========================================"
    echo "課題No: ${issue_no}"
    echo "作成日時: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"
    echo ""
    echo "# ${issue_no}: ${selected_type}"
    echo ""
    echo "## 基本情報"
    echo "- **対応種別**: ${selected_type}"
    echo "- **対象システム**: ${system_text}"
    echo "- **対象ページ**: ${page_name}"
    echo "- **対象機能**: ${feature_name}"
    echo ""
    echo "${type_text}"
    echo ""
    echo "## 課題"
    echo "${issue}"
    echo ""
    echo "## 期待する状態"
    echo "${expected}"
    echo ""
    echo "## なぜそれをやるのか？"
    echo "${reason}"
} >> "$OUTPUT_FILE" 2>/dev/null || {
    echo -e "${RED}エラー: ${OUTPUT_FILE} への書き込みに失敗しました${NC}" >&2
    echo -e "${RED}ファイルの権限を確認してください${NC}" >&2
    exit 1
}

# オプション項目の追記
{
    if [ -n "$not_do" ]; then
        echo ""
        echo "## やらないこと"
        echo "${not_do}"
    fi

    echo ""
    echo "## 受入条件"
    echo "${acceptance}"

    if [ -n "$prerequisites" ]; then
        echo ""
        echo "## 前提条件"
        echo "${prerequisites}"
    fi

    if [ -n "$notes" ]; then
        echo ""
        echo "## 補足"
        echo "${notes}"
    fi

    echo ""
} >> "$OUTPUT_FILE" 2>/dev/null

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}課題管理表の作成が完了しました。${NC}"
echo -e "${GREEN}内容はissue_note.txtに追加しました。${NC}"
echo -e "${GREEN}課題No: ${issue_no}${NC}"
echo -e "${GREEN}========================================${NC}"
