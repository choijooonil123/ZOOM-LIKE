"""
원격 백엔드 서버 테스트
"""
import requests
import json
import time

BACKEND_URL = "https://zoom-like.onrender.com"

print("=" * 60)
print("원격 백엔드 서버 테스트")
print(f"서버 URL: {BACKEND_URL}")
print("=" * 60)

# 테스트 1: 헬스 체크
print("\n1. 헬스 체크 테스트...")
try:
    response = requests.get(f"{BACKEND_URL}/health", timeout=30)
    print(f"   상태 코드: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ 서버 정상 작동")
        print(f"   응답: {json.dumps(data, indent=2, ensure_ascii=False)}")
    else:
        print(f"   ❌ 서버 오류: {response.status_code}")
        print(f"   응답: {response.text}")
except requests.exceptions.Timeout:
    print(f"   [타임아웃] Render 서버가 슬리프 모드에서 깨어나는 중일 수 있습니다")
    print(f"   (무료 티어는 15분 비활성 시 슬리프 모드)")
    print(f"   브라우저에서 직접 접속해보세요: {BACKEND_URL}/health")
except requests.exceptions.ConnectionError:
    print(f"   ❌ 연결 오류 - 서버에 연결할 수 없습니다")
except Exception as e:
    print(f"   ❌ 오류 발생: {e}")

# 테스트 2: API 엔드포인트 확인
print("\n2. API 엔드포인트 확인...")
try:
    # 회원가입 엔드포인트 존재 확인 (OPTIONS 요청)
    response = requests.options(f"{BACKEND_URL}/api/register", timeout=10)
    print(f"   /api/register 상태 코드: {response.status_code}")
    if response.status_code in [200, 405]:
        print(f"   ✅ API 엔드포인트 접근 가능")
    else:
        print(f"   ⚠️ 예상치 못한 응답: {response.status_code}")
except Exception as e:
    print(f"   ⚠️ API 엔드포인트 확인 실패: {e}")

# 테스트 3: CORS 확인
print("\n3. CORS 설정 확인...")
try:
    headers = {
        'Origin': 'https://screen-share-b540b.web.app',
        'Access-Control-Request-Method': 'POST'
    }
    response = requests.options(
        f"{BACKEND_URL}/api/register",
        headers=headers,
        timeout=10
    )
    cors_headers = {
        'access-control-allow-origin': response.headers.get('Access-Control-Allow-Origin'),
        'access-control-allow-methods': response.headers.get('Access-Control-Allow-Methods'),
        'access-control-allow-credentials': response.headers.get('Access-Control-Allow-Credentials')
    }
    print(f"   CORS 헤더: {json.dumps(cors_headers, indent=2, ensure_ascii=False)}")
    if cors_headers['access-control-allow-origin'] in ['*', 'https://screen-share-b540b.web.app']:
        print(f"   ✅ CORS 설정 정상")
    else:
        print(f"   ⚠️ CORS 설정 확인 필요")
except Exception as e:
    print(f"   ⚠️ CORS 확인 실패: {e}")

print("\n" + "=" * 60)
print("테스트 완료")
print("=" * 60)

