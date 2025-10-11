#!/usr/bin/env bash
set -e

# =========================
# NPMパッケージ自動アップデートスクリプト
# =========================
# 使用例:
#   ./scripts/publish.sh patch
#   ./scripts/publish.sh minor
#   ./scripts/publish.sh major
#
# 処理内容:
# 1. packages/functions のバージョン更新
# 2. packages/react の依存関係とバージョン更新
# 3. git commit / tag / push
# =========================

# --- 引数チェック ---
VERSION_TYPE=$1
if [[ -z "$VERSION_TYPE" ]]; then
  echo "❌ エラー: バージョンタイプを指定してください。"
  echo "使用例: ./scripts/publish.sh patch"
  exit 1
fi

if [[ "$VERSION_TYPE" != "patch" && "$VERSION_TYPE" != "minor" && "$VERSION_TYPE" != "major" ]]; then
  echo "❌ 無効なバージョンタイプ: $VERSION_TYPE"
  echo "使用可能な値: patch | minor | major"
  exit 1
fi

# --- 関数パッケージのバージョン更新 ---
echo "📦 Updating packages/functions ($VERSION_TYPE)..."
npm version "$VERSION_TYPE" -w packages/functions

# 新しい functions のバージョンを取得
NEW_VERSION=$(node -p "require('./packages/functions/package.json').version")
echo "✅ functions の新バージョン: $NEW_VERSION"

# --- React パッケージの依存更新 ---
echo "📦 Updating packages/react..."
npm i "@tremolo-ui/functions@$NEW_VERSION" -w packages/react

# React パッケージのバージョンも同様に更新
npm version "$VERSION_TYPE" -w packages/react

# --- Git コミット & タグ ---
echo "📝 Committing changes..."

FILES=$(find . \
  \( -path "./node_modules" -o -path "./packages/*/node_modules" \) -prune -o \
  \( -path "./package.json" -o -path "./package-lock.json" -o -path "./packages/*/package.json" -o -path "./packages/*/package-lock.json" \) \
  -type f -print)

if [[ -z "$FILES" ]]; then
  echo "⚠️ コミット対象のファイルが見つかりません。"
  exit 1
fi

git add $FILES
git commit -m "publish: $NEW_VERSION"

echo "🏷️ Creating git tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

# --- Push ---
echo "🚀 Pushing to remote..."
git push origin main
git push origin "v$NEW_VERSION"

echo "✅ 完了: バージョン v$NEW_VERSION が公開されました！"
