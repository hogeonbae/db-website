'use client';

import React, { useState, useEffect } from 'react';

interface ScrapingConfig {
  start_id: number;
  end_id: number;
  batch_size: number;
  cafe_id: string;
  menu_id: string;
}

interface ScrapingLog {
  id: number;
  executed_at: string;
  status: string;
  message: string;
}

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // 스크래핑 관련 상태들
  const [startId, setStartId] = useState('');
  const [endId, setEndId] = useState('');
  const [batchSize, setBatchSize] = useState('5');
  const [cafeId, setCafeId] = useState('10094408');
  const [menuId, setMenuId] = useState('415');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 세션 스토리지에서 인증 상태 확인
    const authStatus = sessionStorage.getItem('authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadSavedValues();
      fetchLogs();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('authenticated', 'true');
      setError('');
      loadSavedValues();
      fetchLogs();
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

  // 컴포넌트 마운트 시 저장된 설정 불러오기
  const loadSavedValues = () => {
    const saved = localStorage.getItem('scraping-config');
    if (saved) {
      const config = JSON.parse(saved);
      setStartId(config.startId || '');
      setEndId(config.endId || '');
      setBatchSize(config.batchSize || '5');
      setCafeId(config.cafeId || '10094408');
      setMenuId(config.menuId || '415');
    }
  };

  const saveValues = () => {
    const config = { startId, endId, batchSize, cafeId, menuId };
    localStorage.setItem('scraping-config', JSON.stringify(config));
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs', {
        headers: {
          'x-session-auth': 'authenticated'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.map((log: any) => `${log.executed_at}: ${log.status} - ${log.message || ''}`));
      }
    } catch (error) {
      console.error('로그 조회 실패:', error);
    }
  };

  const handleScrape = async () => {
    if (!startId || !endId) {
      alert('시작 시퀀스와 종료 시퀀스를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    saveValues();

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-auth': 'authenticated'
        },
        body: JSON.stringify({
          start_id: parseInt(startId),
          end_id: parseInt(endId),
          batch_size: parseInt(batchSize),
          cafe_id: cafeId,
          menu_id: menuId,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('스크래핑이 완료되었습니다!');
        fetchLogs();
      } else {
        alert(`스크래핑 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('스크래핑 요청 실패:', error);
      alert('스크래핑 요청 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 로그 새로고침 제거 (서버 비용 절약)
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const interval = setInterval(fetchLogs, 5000);
  //     return () => clearInterval(interval);
  //   }
  // }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center mb-6">관리자 로그인</h1>
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
                placeholder="관리자 비밀번호를 입력하세요"
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">관리자 페이지</h1>
          <div className="flex gap-4">
            <a 
              href="/" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              메인 페이지
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">스크래핑 설정</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 시퀀스
              </label>
              <input
                type="number"
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 3879427"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 시퀀스
              </label>
              <input
                type="number"
                value={endId}
                onChange={(e) => setEndId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 3879500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배치 크기
              </label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카페 ID
              </label>
              <input
                type="text"
                value={cafeId}
                onChange={(e) => setCafeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10094408"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메뉴 ID
              </label>
              <input
                type="text"
                value={menuId}
                onChange={(e) => setMenuId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="415"
              />
            </div>
          </div>
          
          <button
            onClick={handleScrape}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isLoading ? '스크래핑 실행 중...' : '수동 스크래핑 실행'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">실행 로그</h2>
            <button
              onClick={fetchLogs}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              🔄 로그 새로고침
            </button>
          </div>
          <div className="bg-gray-100 p-4 rounded-md h-96 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">로그가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 