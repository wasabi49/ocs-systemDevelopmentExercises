import type { Config } from 'jest'

const config: Config = {
  // テストの詳細な結果を出力
  verbose: true,
  // テストを逐次的に実行
  maxConcurrency: 1,
  // 各テストの後でモックはリセット
  clearMocks: true,
  // テストカバレッジ情報を出力する
  collectCoverage: true,
  // カバレッジレポートを出力するディレクトリ
  coverageDirectory: 'test/coverage',
  // Jestがテストの結果を報告するために使用するレポーターを設定
  reporters: ['default'],
  // TypeScriptのコードを理解できるようにする設定
  preset: 'ts-jest',
  // テストをNode.js環境で実行する
  testEnvironment: 'node',
  // Babelを使用してトランスパイル
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest"
  }
}

export default config