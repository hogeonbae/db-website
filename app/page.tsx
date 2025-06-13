'use client';

import { useState, useEffect } from 'react';
import NewsTable from '../components/NewsTable';
import Link from 'next/link';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 세션 스토리지에서 인증 상태 확인
    const authStatus = sessionStorage.getItem('authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 비밀번호 확인 (실제 환경에서는 더 안전한 방법 사용)
    if (password === 'admin123!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('authenticated', 'true');
      setError('');
    } else {
      setError('잘못된 비밀번호입니다.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('authenticated');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center mb-6">로그인</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            {error && (
              <div className="mb-4 text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            셀러오션 데이터 수집 시스템
          </h1>
          <div className="flex gap-4">
            <Link 
              href="/admin" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              관리자 페이지
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>
        <NewsTable />
      </div>
    </main>
  );
}
