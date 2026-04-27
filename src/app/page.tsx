export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hydrangea-100 via-hydrangea-200 to-hydrangea-400 p-6">
      <div className="text-center">
        <div className="inline-block mb-6 px-3 py-1 rounded-full bg-white/40 backdrop-blur text-sm text-hydrangea-700 font-medium">
          ✨ Beta
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-hydrangea-700 mb-4">DearDay</h1>
        <p className="text-hydrangea-600 text-base md:text-lg mb-8">소중한 날을 초대하다</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/cards/new" className="px-8 py-3 rounded-full bg-hydrangea-500 text-white font-medium shadow-lg active:scale-95 transition">
            초대장 만들기
          </a>
          <a href="/cards" className="px-8 py-3 rounded-full bg-white/70 backdrop-blur text-hydrangea-700 font-medium active:scale-95 transition">
            내 초대장
          </a>
        </div>
      </div>
    </main>
  );
}
