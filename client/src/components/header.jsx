const Header = () => {
  return (
    <>
      <div className="flex justify-center items-center p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🤖 SIREN AI
          </h1>
          <p className="text-sm text-gray-400 mt-1">Powered by Google Gemini</p>
        </div>
      </div>
    </>
  );
};

export default Header;