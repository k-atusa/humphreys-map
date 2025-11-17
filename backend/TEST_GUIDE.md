# Backend 인증 및 권한 테스트 가이드

## 테스트 시나리오

### 1. 인증 없이 장소 추가 (❌ 실패해야 함)

```bash
curl -X POST "http://localhost:3001/api/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "buildingNumber": "TEST-001",
    "name": "테스트 건물",
    "category": "카페",
    "latitude": 36.9686,
    "longitude": 127.0374
  }'
```

**예상 결과**: `{"error":"인증 토큰이 필요합니다"}`

### 2. 일반 사용자 계정 생성

```bash
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "normaluser",
    "password": "user123",
    "nickname": "일반유저"
  }'
```

### 3. 일반 사용자 로그인

```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "normaluser",
    "password": "user123"
  }'
```

토큰을 복사해서 `USER_TOKEN` 변수에 저장하세요.

### 4. 일반 사용자로 장소 추가 시도 (❌ 권한 없음)

```bash
USER_TOKEN="여기에_토큰_붙여넣기"

curl -X POST "http://localhost:3001/api/buildings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "buildingNumber": "TEST-002",
    "name": "일반유저 테스트",
    "category": "카페",
    "latitude": 36.9686,
    "longitude": 127.0374
  }'
```

**예상 결과**: `{"error":"관리자 권한이 필요합니다"}`

### 5. Admin 계정으로 로그인

```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "admin",
    "password": "여기에_실제_비밀번호"
  }'
```

토큰을 복사해서 `ADMIN_TOKEN` 변수에 저장하세요.

### 6. Admin으로 장소 추가 (✅ 성공해야 함)

```bash
ADMIN_TOKEN="여기에_admin_토큰_붙여넣기"

curl -X POST "http://localhost:3001/api/buildings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "buildingNumber": "BLDG-9999",
    "name": "관리자 테스트 카페",
    "category": "카페",
    "buildingType": "상업시설",
    "businessHours": "09:00-21:00",
    "contact": "031-1234-5678",
    "description": "API 테스트용 카페",
    "latitude": 36.9686,
    "longitude": 127.0374,
    "address": "Camp Humphreys, Pyeongtaek"
  }'
```

**예상 결과**: 성공 메시지와 함께 `insertedId` 반환

### 7. 추가된 장소 검색 (인증 불필요)

```bash
curl "http://localhost:3001/api/buildings/search?q=관리자테스트"
```

### 8. Admin으로 장소 업데이트 (✅ 성공해야 함)

```bash
curl -X PUT "http://localhost:3001/api/buildings/BLDG-9999" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "업데이트된 테스트 카페",
    "businessHours": "08:00-22:00"
  }'
```

### 9. Admin으로 장소 삭제 (✅ 성공해야 함)

```bash
curl -X DELETE "http://localhost:3001/api/buildings/BLDG-9999" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 테스트 결과 요약

- ✅ **인증 없는 POST/PUT/DELETE 차단**
- ✅ **일반 사용자의 POST/PUT/DELETE 차단** 
- ✅ **Admin 사용자의 모든 작업 허용**
- ✅ **GET 요청은 누구나 가능** (검색, 조회)

## 프론트엔드 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. 일반 계정으로 로그인 → 지도에서 우클릭/길게누르기 시 팝업 안 뜸
3. `admin` 계정으로 로그인 → 지도에서 우클릭/길게누르기 시 팝업 뜸
4. 장소 정보 입력 후 제출 → MongoDB에 저장됨
5. 검색으로 방금 추가한 장소 확인
