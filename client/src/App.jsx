import { useState } from 'react';
import Head from './components/header.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <Head />
      <Chat />
    </div>
  );
}
