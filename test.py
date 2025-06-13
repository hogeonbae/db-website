import json
import logging
import random
import time
import math
import re
import pyperclip
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import requests # requests 라이브러리 추가
import os

# ================ 설정 ================

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('naver_blog_scraper')

# 파일 핸들러 추가
file_handler = logging.FileHandler('scraper.log')
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Vercel Next.js API 엔드포인트 설정
# 로컬에서 테스트할 경우: http://localhost:3000/api/data
# Vercel에 배포된 사이트에서 테스트할 경우: https://your-vercel-app-url/api/data
# 예시: https://db-website-eight.vercel.app/api/data
VERCEL_API_ENDPOINT = os.getenv('VERCEL_API_ENDPOINT', 'http://localhost:3000/api/data')  # 환경변수 사용

# 네이버 계정 정보
NAVER_CREDENTIALS = {
    'username': 'sooaclan12',
    'password': 'tjdtnrgml3#'
}

# 스크래핑 관련 설정 (환경변수에서 읽기)
SCRAPING_CONFIG = {
    'start_id': int(os.getenv('SCRAPING_START_ID', '3879427')),
    'end_id': int(os.getenv('SCRAPING_END_ID', '3879500')),
    'batch_size': int(os.getenv('SCRAPING_BATCH_SIZE', '5')),
    'num_workers': 1,
    'cafe_id': os.getenv('SCRAPING_CAFE_ID', '10094408'),
    'menu_id': os.getenv('SCRAPING_MENU_ID', '415')
}

# 다양한 User-Agent 목록
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
]

# ================ Vercel API 관련 함수 ================

def send_data_to_vercel_api(data_list):
    """
    파싱된 데이터를 Vercel Next.js API 엔드포인트로 전송
    """
    if not data_list:
        return True

    headers = {"Content-Type": "application/json"}
    success_count = 0
    fail_count = 0

    for item in data_list:
        try:
            logger.info(f"전송할 데이터: {item}")
            response = requests.post(VERCEL_API_ENDPOINT, headers=headers, data=json.dumps(item))
            logger.info(f"응답 상태 코드: {response.status_code}")
            logger.info(f"응답 내용: {response.text}")
            response.raise_for_status() # HTTP 오류가 발생하면 예외 발생
            logger.info(f"데이터 전송 성공: {item.get('title', 'N/A')} - {response.status_code}")
            success_count += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"데이터 전송 실패: {item.get('title', 'N/A')} - {e}")
            logger.error(f"응답 상태 코드: {getattr(e.response, 'status_code', 'N/A')}")
            logger.error(f"응답 내용: {getattr(e.response, 'text', 'N/A')}")
            fail_count += 1
    
    if len(data_list) > 0:
        logger.info(f"총 {len(data_list)}개 데이터 중 {success_count}개 성공, {fail_count}개 실패.")
    return success_count == len(data_list) # 모든 데이터가 성공적으로 전송되었는지 여부 반환

# ================ 스크래퍼 관련 함수 ================

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

def init_driver():
    """웹드라이버 초기화 및 네이버 로그인"""
    chrome_options = Options()
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument(f"user-agent={random.choice(USER_AGENTS)}")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-automation")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    # headless 모드 비활성화 (브라우저 창이 보이도록)
    # chrome_options.add_argument("--headless")  # 주석 처리
    # chrome_options.add_argument("--no-sandbox")  # GitHub Actions용 (로컬에서는 불필요)
    # chrome_options.add_argument("--disable-dev-shm-usage")  # GitHub Actions용 (로컬에서는 불필요)
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    if not naver_login(driver):
        driver.quit()
        raise Exception("네이버 로그인 실패")
        
    return driver

def naver_login(driver):
    """네이버 로그인 수행"""
    logger.info("네이버 로그인 시도 중")
    driver.get('https://nid.naver.com/nidlogin.login?mode=form&url=https://blog.naver.com/')
    time.sleep(3)  # 페이지 로딩 대기 시간 증가

    try:
        # ID 입력
        id_input = WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, "id")))
        id_input.clear()
        id_input.send_keys(NAVER_CREDENTIALS['username'])
        time.sleep(1)

        # 비밀번호 입력
        pw_input = WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, "pw")))
        pw_input.clear()
        pw_input.send_keys(NAVER_CREDENTIALS['password'])
        time.sleep(1)

        # 로그인 버튼 클릭
        login_button = WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.ID, "log.login")))
        login_button.click()
        time.sleep(5)  # 캡차나 추가 인증을 위한 대기 시간 증가

        # 로그인 성공 확인 (더 긴 대기 시간)
        try:
            WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CLASS_NAME, "button_signout")))
            logger.info("네이버 로그인 성공")
            return True
        except:
            # 다른 방법으로 로그인 성공 확인
            current_url = driver.current_url
            if "nid.naver.com" not in current_url:
                logger.info("네이버 로그인 성공 (URL 변경 확인)")
                return True
            else:
                logger.error("네이버 로그인 실패: 로그인 후 페이지 확인 불가")
                return False
                
    except Exception as e:
        logger.error(f"네이버 로그인 실패: {e}")
        return False

def fetch_article_data(driver, article_seq, cafe_id, menu_id):
    """지정된 글 시퀀스에 대한 데이터 가져오기"""
    try:
        url = f"https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/{cafe_id}/articles/{article_seq}?fromList=true&menuId={menu_id}&useCafeId=true"
        driver.get(url)
        time.sleep(random.uniform(1.5, 3))
        
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "pre")))
        
        content = driver.find_element(By.TAG_NAME, "pre").text
        logger.info(f"글 시퀀스 {article_seq}에 대한 콘텐츠 가져오기 성공: {content[:100]}...")
        return content
    except Exception as e:
        logger.error(f"글 {article_seq} 가져오기 오류: {str(e)}")
        return None

def parse_json(article_seq, json_str, cafe_id, menu_id):
    """JSON 응답 파싱하여 필요한 데이터 추출"""
    try:
        pattern = r'"writer":\{"id":"([^"]+)"'
        match = re.search(pattern, json_str)
        
        if not match:
            logger.info(f"글 시퀀스 {article_seq}: writer.id를 찾을 수 없습니다")
            return None
            
        user_id = match.group(1)
        data = json.loads(json_str)
        result = data.get('result', {})
        article = result.get('article', {})
        
        # 작성일 추출 및 포맷팅
        write_date_ms = article.get('writeDate', 0)
        if write_date_ms > 0:
            write_date = datetime.fromtimestamp(write_date_ms / 1000.0).strftime("%Y-%m-%d %H:%M:%S")
        else:
            write_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 이메일 생성
        email = f"{user_id}@naver.com"
        
        # Vercel API에 보낼 데이터 형식
        parsed_data = {
            "title": f"카페 게시글 {article_seq} - 작성자: {user_id}",
            "url": f"https://cafe.naver.com/ArticleRead.nhn?clubid={cafe_id}&menuid={menu_id}&articleid={article_seq}",
            "date": write_date,
            "author": user_id,
            "email": email
        }
        
        logger.info(f"글 시퀀스 {article_seq}에 대한 데이터 파싱 성공: {parsed_data}")
        return parsed_data
        
    except Exception as e:
        logger.error(f"글 시퀀스 {article_seq}: 파싱 오류 - {str(e)}")
        return None

# ================ 배치 처리 함수 ================

def process_batch(start_id, end_id):
    """주어진 ID 범위의 게시글을 처리하고 Vercel API로 전송"""
    driver = init_driver()
    batch_to_send = []
    
    try:
        current_id = start_id
        while current_id <= end_id:
            content = fetch_article_data(
                driver, 
                current_id, 
                SCRAPING_CONFIG['cafe_id'], 
                SCRAPING_CONFIG['menu_id']
            )
            
            if content:
                # parse_json 함수에 cafe_id와 menu_id 전달
                parsed_data = parse_json(current_id, content, SCRAPING_CONFIG['cafe_id'], SCRAPING_CONFIG['menu_id'])
                if parsed_data:
                    batch_to_send.append(parsed_data)
                    
                    if len(batch_to_send) >= SCRAPING_CONFIG['batch_size']:
                        send_data_to_vercel_api(batch_to_send)
                        batch_to_send = []
            
            current_id += 1
            time.sleep(random.uniform(0.5, 1.0))
            
        if batch_to_send: # 남은 데이터 전송
            send_data_to_vercel_api(batch_to_send)
            
    finally:
        driver.quit()

# ================ 메인 함수 ================

def main():
    """메인 함수"""
    logger.info("네이버 블로그 스크래퍼 시작 (Vercel API 연동)")
    
    START_ID = SCRAPING_CONFIG['start_id']
    END_ID = SCRAPING_CONFIG['end_id']
    NUM_WORKERS = SCRAPING_CONFIG['num_workers']
    
    chunk_size = math.ceil((END_ID - START_ID + 1) / NUM_WORKERS)
    
    ranges = []
    for i in range(NUM_WORKERS):
        start = START_ID + (i * chunk_size)
        end = min(END_ID, start + chunk_size - 1)
        ranges.append((start, end))
    
    logger.info(f"{NUM_WORKERS}개의 작업자로 병렬 처리 시작")
    
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        futures = [
            executor.submit(
                process_batch, 
                start, 
                end
            ) for start, end in ranges
        ]
        
        for future in futures:
            try:
                future.result()
            except Exception as e:
                logger.error(f"작업자 실패: {e}")

    logger.info("데이터 수집 및 Vercel API 전송이 완료되었습니다")

if __name__ == "__main__":
    main()