const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      <h1 className="mt-4 text-xl font-bold">Loading...</h1>
      <h2 className="mt-2 text-gray-600">データを読み込み中です</h2>
    </div>
  );
};

export default Loading;