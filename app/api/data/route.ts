import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, url, date, author, email } = await request.json();

    if (!title || !url || !date || !author || !email) {
      return NextResponse.json({ error: 'Title, URL, Date, Author, and Email are required' }, { status: 400 });
    }

    // 테이블이 없으면 생성
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

    // 데이터 삽입
    await sql`
      INSERT INTO news (title, url, date, author, email)
      VALUES (${title}, ${url}, ${date}, ${author}, ${email});
    `;

    return NextResponse.json({ message: 'Data inserted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 