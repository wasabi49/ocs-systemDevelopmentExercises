const Loading = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-solid border-blue-500"></div>
      <h1 className="mt-4 text-xl font-bold">Loading...</h1>
      <h2 className="mt-2 text-gray-600">データを読み込み中です</h2>
    </div>
  );
};

export default Loading;
