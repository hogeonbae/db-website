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

    // 테이블이 존재하지 않으면 생성 (실제 사용하는 테이블명으로 수정)
    await sql`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        date VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      );
    `;

    let query;
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (limit && offset) {
      query = sql`
        SELECT * FROM news 
        ORDER BY id DESC 
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};
      `;
    } else {
      query = sql`
        SELECT * FROM news 
        ORDER BY id DESC;
      `;
    }

    const result = await query;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 