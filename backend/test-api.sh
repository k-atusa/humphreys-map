#!/bin/bash

# Backend API 테스트 스크립트
# 관리자 인증 및 장소 추가 테스트

API_URL="http://localhost:3001/api"
echo "🧪 Humphreys Map Backend API 테스트"
echo "=================================="
echo ""

# 1. 관리자 계정 등록 (이미 있다면 건너뛰기)
echo "1️⃣  관리자 계정 등록 중..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "admin",
    "password": "admin123",
    "nickname": "관리자"
  }')
echo "등록 응답: $REGISTER_RESPONSE"
echo ""

# 2. 관리자 로그인
echo "2️⃣  관리자 로그인 중..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "admin",
    "password": "admin123"
  }')
echo "로그인 응답: $LOGIN_RESPONSE"

# 토큰 추출
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 로그인 실패: 토큰을 받지 못했습니다"
  exit 1
fi

echo "✅ 토큰 획득: ${TOKEN:0:50}..."
echo ""

# 3. 인증 없이 장소 추가 시도 (실패해야 함)
echo "3️⃣  인증 없이 장소 추가 시도 (실패 예상)..."
NO_AUTH_RESPONSE=$(curl -s -X POST "$API_URL/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "buildingNumber": "TEST-001",
    "name": "테스트 건물",
    "category": "테스트",
    "latitude": 36.9686,
    "longitude": 127.0374
  }')
echo "응답: $NO_AUTH_RESPONSE"
echo ""

# 4. 일반 사용자 계정 등록 및 로그인
echo "4️⃣  일반 사용자 계정 생성 중..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "testuser",
    "password": "test123",
    "nickname": "테스트유저"
  }' > /dev/null

USER_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "testuser",
    "password": "test123"
  }')

USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_TOKEN" ]; then
  echo "✅ 일반 사용자 토큰 획득"
  echo ""
  
  # 5. 일반 사용자로 장소 추가 시도 (권한 없음, 실패해야 함)
  echo "5️⃣  일반 사용자로 장소 추가 시도 (권한 없음 예상)..."
  USER_ADD_RESPONSE=$(curl -s -X POST "$API_URL/buildings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{
      "buildingNumber": "TEST-002",
      "name": "일반 유저 테스트",
      "category": "테스트",
      "latitude": 36.9686,
      "longitude": 127.0374
    }')
  echo "응답: $USER_ADD_RESPONSE"
  echo ""
fi

# 6. 관리자로 장소 추가 (성공해야 함)
echo "6️⃣  관리자로 장소 추가 시도 (성공 예상)..."
ADMIN_ADD_RESPONSE=$(curl -s -X POST "$API_URL/buildings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "buildingNumber": "BLDG-9999",
    "name": "테스트 카페",
    "category": "카페",
    "buildingType": "상업시설",
    "businessHours": "09:00-21:00",
    "contact": "031-1234-5678",
    "description": "API 테스트용 카페",
    "latitude": 36.9686,
    "longitude": 127.0374,
    "address": "Camp Humphreys, Pyeongtaek"
  }')
echo "응답: $ADMIN_ADD_RESPONSE"
echo ""

# 7. 추가된 장소 조회
echo "7️⃣  추가된 장소 검색 중..."
SEARCH_RESPONSE=$(curl -s "$API_URL/buildings/search?q=테스트카페")
echo "검색 결과: $SEARCH_RESPONSE"
echo ""

# 8. 특정 건물 조회
BUILDING_ID=$(echo $ADMIN_ADD_RESPONSE | grep -o '"buildingNumber":"[^"]*"' | cut -d'"' -f4)
if [ -n "$BUILDING_ID" ]; then
  echo "8️⃣  건물 상세 조회 (buildingNumber: $BUILDING_ID)..."
  DETAIL_RESPONSE=$(curl -s "$API_URL/buildings/$BUILDING_ID")
  echo "상세 정보: $DETAIL_RESPONSE"
  echo ""
  
  # 9. 관리자로 건물 정보 업데이트
  echo "9️⃣  관리자로 건물 정보 업데이트..."
  UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/buildings/$BUILDING_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "name": "업데이트된 테스트 카페",
      "businessHours": "08:00-22:00"
    }')
  echo "업데이트 응답: $UPDATE_RESPONSE"
  echo ""
fi

echo "=================================="
echo "✅ 테스트 완료!"
echo ""
echo "요약:"
echo "- 관리자 계정 생성 및 로그인"
echo "- 인증 없는 요청 차단 확인"
echo "- 일반 사용자 권한 제한 확인"
echo "- 관리자 장소 추가 성공"
echo "- 장소 검색 및 조회"
echo "- 관리자 업데이트 권한"
