import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // 모든 테이블 목록 조회
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    console.log('Available tables:', tables.rows);

    // news 테이블 데이터 조회
    let newsData: any[] = [];
    try {
      const newsResult = await sql`SELECT * FROM news ORDER BY id DESC LIMIT 10;`;
      newsData = newsResult.rows;
    } catch (error) {
      console.log('news 테이블 조회 실패:', error);
    }

    return NextResponse.json({
      tables: tables.rows,
      newsData: newsData,
      newsCount: newsData.length
    });

  } catch (error) {
    console.error('데이터베이스 테스트 오류:', error);
    return NextResponse.json({ error: 'Database test failed', details: error }, { status: 500 });
  }
} 