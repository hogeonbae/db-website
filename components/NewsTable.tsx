'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// 뉴스 데이터 타입 정의
interface NewsItem {
  id: number;
  title: string;
  url: string;
  date: string;
  author: string;
  email: string;
}

export default function NewsTable() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-data', {
        headers: {
          'x-session-auth': 'authenticated'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else if (response.status === 401) {
        setError('인증이 필요합니다.');
      } else {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('데이터 조회 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 자동 새로고침 제거 (서버 비용 절약)
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleDownloadEmails = () => {
    if (data.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // 이메일만 추출하여 엑셀 데이터 생성
    const emailData = data.map((item, index) => ({
      '번호': index + 1,
      '이메일': item.email,
      '작성자': item.author,
      '수집일시': new Date(item.date).toLocaleString('ko-KR')
    }));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(emailData);
    
    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 8 },  // 번호
      { wch: 30 }, // 이메일
      { wch: 15 }, // 작성자
      { wch: 20 }  // 수집일시
    ];
    worksheet['!cols'] = columnWidths;

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '이메일 목록');

    // 파일명 생성 (현재 날짜 포함)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    const fileName = `네이버카페_이메일목록_${dateStr}.xlsx`;

    // 파일 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          수집된 데이터 ({data.length}개)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadEmails}
            disabled={data.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            📊 이메일 엑셀 다운로드
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                새로고침 중...
              </>
            ) : (
              <>
                🔄 새로고침
              </>
            )}
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          아직 수집된 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수집일시
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  링크
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.date).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      게시글 보기
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 