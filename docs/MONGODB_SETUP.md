# MongoDB 연결 설정 가이드

## 개요
`humphreys-map` 데이터베이스의 `map` 컬렉션과 연결하는 로직을 구현했습니다.

## 파일 구조

### 1. `/src/config/mongodb.ts`
MongoDB 연결 설정 및 관리
- `connectToMongoDB()`: MongoDB 서버 연결
- `getDatabase()`: 데이터베이스 인스턴스 반환
- `getMapCollection()`: map 컬렉션 반환
- `disconnectFromMongoDB()`: 연결 종료

### 2. `/src/services/mongodbService.ts`
MongoDB CRUD 작업을 위한 서비스 레이어
- `initializeMongoDB()`: MongoDB 초기화
- `searchBuildings(query)`: 장소 검색 (이름, 건물 형태, 카테고리)
- `getBuildingByNumber(buildingNumber)`: 건물 번호로 조회
- `getBuildingsByCategory(category)`: 카테고리별 조회
- `getNearbyBuildings(lat, lon, radius)`: 근처 장소 검색
- `addBuilding(building)`: 새 장소 추가
- `updateBuilding(buildingNumber, updates)`: 장소 정보 업데이트
- `deleteBuilding(buildingNumber)`: 장소 삭제

### 3. `/src/services/searchService.ts`
검색 로직 업데이트 (MongoDB 사용)

### 4. `/src/App.tsx`
앱 시작 시 MongoDB 자동 연결

## 환경 설정

### 1. `.env` 파일 생성
```bash
cp .env.example .env
```

### 2. MongoDB 연결 문자열 설정
`.env` 파일에 다음 추가:

**로컬 MongoDB:**
```
VITE_MONGODB_URI=mongodb://localhost:27017
```

**MongoDB Atlas (클라우드):**
```
VITE_MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
```

### 3. MongoDB 패키지 설치
```bash
npm install mongodb
```

## 데이터 스키마

### BuildingData 인터페이스
```typescript
{
  buildingNumber: string;      // 건물 번호
  name: string;                // 장소 이름
  category: string;            // 카테고리
  buildingType: string;        // 건물 형태
  businessHours?: string;      // 영업 시간
  contact?: string;            // 연락처
  address?: string;            // 주소
  latitude: number;            // 위도
  longitude: number;           // 경도
  description?: string;        // 설명
}
```

## MongoDB 데이터 예시

```javascript
// MongoDB Shell 또는 Compass에서 데이터 추가
db.map.insertOne({
  buildingNumber: "1001",
  name: "Post Exchange (PX)",
  category: "shopping",
  buildingType: "상업시설",
  businessHours: "09:00 - 21:00",
  contact: "031-123-4567",
  address: "Building 1001",
  latitude: 36.9686,
  longitude: 127.0374,
  description: "군부대 내 종합 쇼핑센터",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 사용 방법

### 1. MongoDB 연결 확인
앱이 시작되면 자동으로 MongoDB에 연결됩니다. 콘솔에서 확인:
```
✅ MongoDB 연결 성공
MongoDB 초기화 완료
```

### 2. 검색 기능
사용자가 검색창에 입력하면 자동으로 MongoDB에서 데이터를 조회합니다.

### 3. 프로그래밍 방식 사용
```typescript
import { 
  searchBuildings, 
  getBuildingByNumber,
  addBuilding 
} from './services/mongodbService';

// 검색
const results = await searchBuildings('PX');

// 특정 건물 조회
const building = await getBuildingByNumber('1001');

// 새 장소 추가
const newId = await addBuilding({
  name: "Fitness Center",
  category: "sports",
  buildingType: "체육시설",
  businessHours: "05:00 - 22:00",
  contact: "031-987-6543",
  latitude: 36.9700,
  longitude: 127.0380
});
```

## 주의사항

### 1. 브라우저 제약
브라우저에서는 직접 MongoDB에 연결할 수 없습니다. 
- **현재 구현**: 프론트엔드 코드 (브라우저에서 실행 불가)
- **필요한 것**: 백엔드 API 서버

### 2. 프로덕션 배포
실제 배포를 위해서는:
1. **백엔드 API 서버 구축** (Node.js + Express)
2. **API 엔드포인트 생성** (GET /api/buildings, POST /api/buildings, etc.)
3. **프론트엔드에서 API 호출** (fetch 또는 axios)

### 3. 보안
- MongoDB 연결 문자열을 `.env` 파일에 저장
- `.env` 파일은 `.gitignore`에 추가 (이미 설정됨)
- 프로덕션에서는 환경 변수 사용

## 다음 단계

### 백엔드 API 서버 구축 (권장)
```
/backend
  /src
    /routes
      - buildings.ts       (API 라우트)
    /controllers
      - buildingController.ts
    - server.ts           (Express 서버)
  - package.json
  - .env
```

백엔드 서버를 구축하면:
- 브라우저에서 안전하게 MongoDB 데이터 접근
- 인증/권한 관리
- API 속도 제한
- 데이터 검증 및 보안

## 문제 해결

### MongoDB 연결 실패
1. MongoDB 서버가 실행 중인지 확인
2. 연결 문자열이 올바른지 확인
3. 네트워크 방화벽 설정 확인

### TypeScript 오류
```bash
npm install mongodb
npm install --save-dev @types/node
```

## 카테고리 목록

지원되는 카테고리:
- shopping: 쇼핑
- food: 음식점
- medical: 의료시설
- education: 교육시설
- sports: 체육시설
- administrative: 행정시설
- residential: 거주시설
- entertainment: 엔터테인먼트
- service: 서비스
- transportation: 교통
- military: 군사시설
- religious: 종교시설
- recreation: 레크리에이션
- other: 기타
