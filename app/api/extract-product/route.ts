import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();
        
        if (!url) {
            return NextResponse.json({
                error: '상품 URL이 필요합니다.'
            }, { status: 400 });
        }
        
        // 새로운 Node.js 스크래핑 API 호출
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/scrape-naver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        
        const result = await response.json();
        
        if (result.error) {
            return NextResponse.json({
                error: result.error
            }, { status: 400 });
        }
        
        // 기존 API 응답 형식으로 변환
        return NextResponse.json({
            sellerName: result.sellerName,
            productName: result.productName,
            productNumber: result.productNumber,
            price: result.price
        });
        
    } catch (error) {
        console.error('Extract Product API Error:', error);
        return NextResponse.json({
            error: '상품 정보 추출 중 오류가 발생했습니다.'
        }, { status: 500 });
    }
} 