import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// 간단한 인증 체크 함수
function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const sessionAuth = request.headers.get('x-session-auth');
  
  // 세션 기반 인증 (브라우저에서 호출)
  if (sessionAuth === 'authenticated') {
    return true;
  }
  
  // API 키 기반 인증 (서버에서 호출)
  if (authHeader === 'Bearer admin123!') {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // 인증 체크
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 스크래핑 로그 테이블이 없으면 생성
    await sql`
      CREATE TABLE IF NOT EXISTS scraping_logs (
        id SERIAL PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50),
        message TEXT
      );
    `;

    // 스크래핑 로그 조회
    const result = await sql`
      SELECT * FROM scraping_logs 
      ORDER BY executed_at DESC 
      LIMIT 50;
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('로그 조회 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 