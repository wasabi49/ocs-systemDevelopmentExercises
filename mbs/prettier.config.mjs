const config = {
  // Tailwind CSSのクラスを自動的にソートするプラグイン
  plugins: ['prettier-plugin-tailwindcss'],
  // 文末にセミコロンを追加する
  semi: true,
  // 文字列はシングルクォートで囲む
  singleQuote: true,
  // 配列や引数リストの最後にカンマを常に付ける
  trailingComma: 'all',
  // インデントはスペース2文字分
  tabWidth: 2,
  // 1行あたりの最大文字数
  printWidth: 100,
  // 改行コードをLF（Unix/Linux形式）に統一
  endOfLine: 'lf',
};
export default config;
