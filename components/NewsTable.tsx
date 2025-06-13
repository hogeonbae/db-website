'use client';

import React, { useState } from 'react';

// 뉴스 데이터 타입 정의
interface NewsItem {
  id: number;
  title: string;
  url: string;
  date: string;
}

// 예시 더미 데이터 (데이터 추가)
const newsData: NewsItem[] = [
  {
    id: 1,
    title: 'OpenAI, GPT-4o 공개',
    url: 'https://openai.com/blog/gpt-4o',
    date: '2024-06-01',
  },
  {
    id: 2,
    title: 'Next.js 15 출시',
    url: 'https://nextjs.org/blog/next-15',
    date: '2024-05-20',
  },
  {
    id: 3,
    title: 'React 19 베타 릴리즈',
    url: 'https://react.dev/blog/2024/05/10/react-19-beta',
    date: '2024-05-10',
  },
  {
    id: 4,
    title: 'TypeScript 5.0 릴리즈',
    url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/',
    date: '2024-04-15',
  },
  {
    id: 5,
    title: 'TailwindCSS 3.0 출시',
    url: 'https://tailwindcss.com/blog/tailwindcss-v3',
    date: '2024-03-01',
  },
  {
    id: 6,
    title: 'Node.js 20 LTS 릴리즈',
    url: 'https://nodejs.org/en/blog/release/v20.0.0/',
    date: '2024-02-10',
  },
  {
    id: 7,
    title: 'Docker Desktop 4.0 출시',
    url: 'https://www.docker.com/blog/docker-desktop-4-0/',
    date: '2024-01-20',
  },
  {
    id: 8,
    title: 'AWS Lambda 함수 URL 지원',
    url: 'https://aws.amazon.com/blogs/aws/announcing-aws-lambda-function-urls/',
    date: '2024-01-05',
  },
  {
    id: 9,
    title: 'GitHub Copilot X 출시',
    url: 'https://github.blog/2024-03-22-github-copilot-x-the-ai-powered-developer-experience/',
    date: '2023-12-15',
  },
  {
    id: 10,
    title: 'Vercel AI SDK 릴리즈',
    url: 'https://vercel.com/blog/vercel-ai-sdk',
    date: '2023-11-30',
  },
];

const NewsTable: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'today'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 오늘 날짜 필터링
  const today = new Date().toISOString().split('T')[0];
  const filteredData = filter === 'today' ? newsData.filter(item => item.date === today) : newsData;

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">셀러오션</h2>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            className={`px-4 py-2 rounded ${filter === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter('today')}
          >
            오늘
          </button>
        </div>
      </div>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">번호</th>
            <th className="py-2 px-4 border-b">제목</th>
            <th className="py-2 px-4 border-b">날짜</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b text-center">{item.id}</td>
              <td className="py-2 px-4 border-b">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {item.title}
                </a>
              </td>
              <td className="py-2 px-4 border-b text-center">{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsTable; 