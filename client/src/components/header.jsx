const Header = () => {
  return (
    <>
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b-2 border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-black text-white w-10 h-10 flex items-center justify-center font-bold text-xl">S</div>
          <div>
            <h1 className="text-xl font-black text-black tracking-tighter leading-none">SIREN AI</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Terminal Interface v1.0</p>
          </div>
        </div>
        <div className="hidden md:block">
           <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border border-gray-200 px-3 py-1">Secure Protocol</div>
        </div>
      </div>
    </>
  );
};

export default Header;