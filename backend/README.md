# Humphreys Map - Backend API Server

## 개요
Humphreys Map 애플리케이션을 위한 Express + MongoDB 백엔드 API 서버입니다.

## 디렉토리 구조
```
backend/
├── src/
│   ├── config/
│   │   └── mongodb.ts          # MongoDB 연결 설정
│   ├── controllers/
│   │   └── buildingController.ts  # 건물 관련 비즈니스 로직
│   ├── routes/
│   │   └── buildings.ts        # API 라우트 정의
│   ├── types/
│   │   └── building.ts         # TypeScript 타입 정의
│   └── server.ts               # Express 서버 진입점
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일 수정:
```env
MONGODB_URI=mongodb://localhost:27017
PORT=3001
NODE_ENV=development
```

### 3. 개발 서버 실행
```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## API 엔드포인트

### 건물 검색
**GET** `/api/buildings/search?q={query}`

쿼리 파라미터:
- `q`: 검색어 (이름, 건물 형태, 카테고리)

응답:
```json
[
  {
    "id": "1001",
    "buildingNumber": "1001",
    "name": "Post Exchange (PX)",
    "address": "Building 1001, Camp Humphreys",
    "category": "shopping",
    "buildingType": "상업시설",
    "businessHours": "09:00 - 21:00",
    "contact": "031-690-1234",
    "latitude": 36.9686,
    "longitude": 127.0374,
    "description": "군부대 내 종합 쇼핑센터"
  }
]
```

### 모든 건물 조회
**GET** `/api/buildings`

### 특정 건물 조회
**GET** `/api/buildings/:buildingNumber`

### 카테고리별 건물 조회
**GET** `/api/buildings/category/:category`

카테고리 목록:
- `shopping`: 쇼핑
- `food`: 음식점
- `medical`: 의료시설
- `education`: 교육시설
- `sports`: 체육시설
- `administrative`: 행정시설
- `residential`: 거주시설
- `entertainment`: 엔터테인먼트
- `service`: 서비스
- `transportation`: 교통
- `military`: 군사시설
- `religious`: 종교시설
- `recreation`: 레크리에이션
- `other`: 기타

### 근처 건물 검색
**GET** `/api/buildings/nearby?lat={latitude}&lon={longitude}&radius={radius}`

쿼리 파라미터:
- `lat`: 위도 (필수)
- `lon`: 경도 (필수)
- `radius`: 반경 (km, 기본값: 2)

### 새 건물 추가
**POST** `/api/buildings`

요청 본문:
```json
{
  "buildingNumber": "6001",
  "name": "New Building",
  "category": "other",
  "buildingType": "기타시설",
  "businessHours": "09:00 - 18:00",
  "contact": "031-123-4567",
  "address": "Building 6001",
  "latitude": 36.9700,
  "longitude": 127.0380,
  "description": "새로운 건물"
}
```

### 건물 정보 업데이트
**PUT** `/api/buildings/:buildingNumber`

요청 본문:
```json
{
  "businessHours": "08:00 - 20:00",
  "contact": "031-999-8888"
}
```

### 건물 삭제
**DELETE** `/api/buildings/:buildingNumber`

### 헬스 체크
**GET** `/health`

응답:
```json
{
  "status": "OK",
  "message": "Humphreys Map API Server is running"
}
```

## MongoDB 데이터 구조

### 컬렉션: `map` (데이터베이스: `humphreys-map`)

```javascript
{
  "_id": ObjectId("..."),
  "buildingNumber": "1001",
  "name": "Post Exchange (PX)",
  "category": "shopping",
  "buildingType": "상업시설",
  "businessHours": "09:00 - 21:00",
  "contact": "031-690-1234",
  "address": "Building 1001, Camp Humphreys",
  "latitude": 36.9686,
  "longitude": 127.0374,
  "description": "군부대 내 종합 쇼핑센터",
  "createdAt": ISODate("2025-01-01T00:00:00Z"),
  "updatedAt": ISODate("2025-01-01T00:00:00Z")
}
```

## 샘플 데이터 추가

MongoDB Shell에서:
```javascript
use humphreys-map

db.map.insertMany([
  {
    buildingNumber: "1001",
    name: "Post Exchange (PX)",
    category: "shopping",
    buildingType: "상업시설",
    businessHours: "09:00 - 21:00",
    contact: "031-690-1234",
    address: "Building 1001, Camp Humphreys",
    latitude: 36.9686,
    longitude: 127.0374,
    description: "군부대 내 종합 쇼핑센터",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    buildingNumber: "2001",
    name: "Commissary",
    category: "shopping",
    buildingType: "식료품점",
    businessHours: "08:00 - 20:00",
    contact: "031-690-2001",
    address: "Building 2001, Camp Humphreys",
    latitude: 36.9700,
    longitude: 127.0380,
    description: "식료품 및 생필품 판매",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    buildingNumber: "3001",
    name: "Brian Allgood Army Community Hospital",
    category: "medical",
    buildingType: "종합병원",
    businessHours: "24시간",
    contact: "031-690-3001",
    address: "Building 3001, Camp Humphreys",
    latitude: 36.9720,
    longitude: 127.0360,
    description: "군 종합병원",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

## CORS 설정
모든 출처에서의 요청을 허용하도록 설정되어 있습니다. 프로덕션 환경에서는 특정 도메인만 허용하도록 수정하세요.

```typescript
// server.ts
app.use(cors({
  origin: 'http://localhost:5173' // 프론트엔드 URL
}));
```

## 에러 처리
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

## 개발 도구
- **tsx**: TypeScript 실시간 실행
- **TypeScript**: 타입 안전성
- **Express**: 웹 프레임워크
- **MongoDB Driver**: 데이터베이스 연결

## 프론트엔드 연동

프론트엔드 `.env` 파일:
```env
VITE_API_URL=http://localhost:3001/api
```

프론트엔드에서 API 호출:
```typescript
import { searchBuildings } from './services/apiService';

const results = await searchBuildings('PX');
```

## 문제 해결

### MongoDB 연결 실패
```
❌ MongoDB 연결 실패
```

해결:
1. MongoDB 서버가 실행 중인지 확인
2. `.env`의 `MONGODB_URI`가 올바른지 확인
3. 방화벽 설정 확인

### 포트 이미 사용 중
```
Error: listen EADDRINUSE: address already in use :::3001
```

해결:
```bash
# 다른 포트 사용
PORT=3002 npm run dev
```

또는 실행 중인 프로세스 종료:
```bash
lsof -ti:3001 | xargs kill
```

## 라이선스
ISC
