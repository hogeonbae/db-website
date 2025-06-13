import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { exec } from 'child_process';
import { promisify } from 'util';
import { spawn } from 'child_process';
import path from 'path';

const execAsync = promisify(exec);

interface ScrapingConfig {
  start_id: number;
  end_id: number;
  batch_size: number;
  cafe_id: string;
  menu_id: string;
}

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

export async function GET() {
  try {
    console.log('자동 스크래핑 시작 (Cron Job)...');
    
    // 기본 설정으로 스크래핑 실행
    const defaultConfig: ScrapingConfig = {
      start_id: 3879427,
      end_id: 3879500,
      batch_size: 5,
      cafe_id: '10094408',
      menu_id: '415'
    };
    
    return await runScraping(defaultConfig);
  } catch (error: any) {
    console.error('자동 스크래핑 오류:', error);
    return NextResponse.json({ 
      error: '자동 스크래핑 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start_id, end_id, batch_size, cafe_id, menu_id } = await request.json();
    
    console.log('수동 스크래핑 시작...', { start_id, end_id, batch_size, cafe_id, menu_id });

    // 개발 환경에서는 Python 스크립트를 실행하지 않음
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경에서는 Python 스크립트를 실행하지 않습니다.');
      return NextResponse.json({ message: '개발 환경에서는 스크래핑을 실행하지 않습니다.' });
    }

    return new Promise((resolve) => {
      console.log('Python 스크립트 실행 중...');
      
      const scriptPath = path.join(process.cwd(), 'test.py');
      const pythonProcess = spawn('python', [scriptPath], {
        env: {
          ...process.env,
          SCRAPING_START_ID: start_id.toString(),
          SCRAPING_END_ID: end_id.toString(),
          SCRAPING_BATCH_SIZE: batch_size.toString(),
          SCRAPING_CAFE_ID: cafe_id,
          SCRAPING_MENU_ID: menu_id,
          VERCEL_API_ENDPOINT: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('Python 스크립트 출력:', chunk);
      });

      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.log('Python 스크립트 에러:', chunk);
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python 스크립트 종료 코드: ${code}`);
        
        if (code === 0) {
          resolve(NextResponse.json({ 
            message: '스크래핑이 성공적으로 완료되었습니다.',
            output: output 
          }));
        } else {
          resolve(NextResponse.json({ 
            error: '스크래핑 중 오류가 발생했습니다.',
            output: output,
            errorOutput: errorOutput 
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python 프로세스 실행 오류:', error);
        resolve(NextResponse.json({ 
          error: 'Python 스크립트 실행에 실패했습니다.',
          details: error.message 
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('스크래핑 API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

async function runScraping(config: ScrapingConfig) {
  const now = new Date().toISOString();
  
  try {
    // 스크래핑 로그 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS scraping_logs (
        id SERIAL PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50),
        message TEXT
      );
    `;
    
    // 시작 로그
    await sql`
      INSERT INTO scraping_logs (status, message)
      VALUES ('started', ${`스크래핑 시작: ${now} - 범위: ${config.start_id} ~ ${config.end_id}`});
    `;
    
    // Python 스크립트 실행을 위한 환경변수 설정
    const env = {
      ...process.env,
      SCRAPING_START_ID: config.start_id.toString(),
      SCRAPING_END_ID: config.end_id.toString(),
      SCRAPING_BATCH_SIZE: config.batch_size.toString(),
      SCRAPING_CAFE_ID: config.cafe_id,
      SCRAPING_MENU_ID: config.menu_id,
      VERCEL_API_ENDPOINT: process.env.NODE_ENV === 'production' 
        ? `${process.env.VERCEL_URL}/api/data`
        : 'http://localhost:3000/api/data'
    };
    
    // Python 스크립트 실행 (실제 환경에서는 경로 조정 필요)
    console.log('Python 스크립트 실행 중...');
    
    try {
      const { stdout, stderr } = await execAsync('python test.py', { env });
      console.log('Python 스크립트 출력:', stdout);
      if (stderr) console.error('Python 스크립트 에러:', stderr);
      
      // 성공 로그
      await sql`
        INSERT INTO scraping_logs (status, message)
        VALUES ('completed', ${`스크래핑 완료: ${new Date().toISOString()}`});
      `;
      
    } catch (execError: any) {
      console.error('Python 스크립트 실행 오류:', execError);
      
      // 오류 로그
      await sql`
        INSERT INTO scraping_logs (status, message)
        VALUES ('error', ${`Python 스크립트 실행 오류: ${execError.message}`});
      `;
      
      throw execError;
    }
    
    return NextResponse.json({ 
      message: '스크래핑이 성공적으로 실행되었습니다',
      timestamp: now,
      config: config
    });
    
  } catch (error: any) {
    console.error('스크래핑 오류:', error);
    
    // 오류 로그
    await sql`
      INSERT INTO scraping_logs (status, message)
      VALUES ('error', ${`스크래핑 오류: ${error.message}`});
    `;
    
    throw error;
  }
} 