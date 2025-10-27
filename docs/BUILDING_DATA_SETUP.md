# 군부대 건물 검색 기능 설정 가이드

## 개요

현재 앱은 두 가지 검색 소스를 사용합니다:
1. **로컬 건물 데이터베이스** - 군부대 내부 건물 번호와 시설 정보
2. **OpenStreetMap API** - 일반 지역 검색

## 건물 데이터 추가 방법

### 1. 건물 데이터 파일 위치
`src/services/localBuildingService.ts` 파일의 `CAMP_HUMPHREYS_BUILDINGS` 배열

### 2. 건물 데이터 형식

```typescript
{
  buildingNumber: '건물번호',    // 예: '6400', 'B-123'
  name: '건물 이름',              // 예: 'PX (Post Exchange)'
  category: '카테고리',           // 예: '쇼핑', '병원', '학교'
  latitude: 위도,                // 예: 36.9700
  longitude: 경도,               // 예: 127.0380
  description: '설명'            // 선택사항
}
```

### 3. 데이터 수집 방법

#### 옵션 A: 수동 입력
1. 지도에서 건물 클릭하여 좌표 확인
2. `localBuildingService.ts`에 직접 추가

#### 옵션 B: CSV 파일에서 가져오기
1. Excel/Google Sheets에서 건물 정보 정리
2. CSV로 저장
3. 변환 스크립트 사용

```typescript
// CSV 변환 예시 (별도 스크립트)
import fs from 'fs';
import Papa from 'papaparse';

const csv = fs.readFileSync('buildings.csv', 'utf8');
const parsed = Papa.parse(csv, { header: true });

const buildings = parsed.data.map(row => ({
  buildingNumber: row['Building Number'],
  name: row['Name'],
  category: row['Category'],
  latitude: parseFloat(row['Latitude']),
  longitude: parseFloat(row['Longitude']),
  description: row['Description']
}));

console.log(JSON.stringify(buildings, null, 2));
```

#### 옵션 C: 데이터베이스 연동
백엔드 API 구축:

```typescript
// src/services/localBuildingService.ts 수정
export async function searchLocalBuildings(query: string): Promise<BuildingData[]> {
  const response = await fetch(`https://your-api.com/buildings/search?q=${query}`);
  return await response.json();
}
```

### 4. 카테고리 목록

앱에서 사용 가능한 카테고리:
- `쇼핑` - PX, Commissary, 매점
- `병원` - 의무실, 병원, 치과
- `학교` - 학교, 교육시설
- `체육시설` - 헬스장, 체육관, 운동장
- `음식점` - 식당, 카페, 푸드코트
- `숙소` - 막사, 숙소
- `관공서` - 행정실, 본부
- `편의시설` - 편의점, 세탁소, 이발소
- `문화시설` - 도서관, 극장
- `주차장`
- `기타`

## 검색 기능 사용법

### 건물 번호로 검색
```
검색창에 입력: "6400"
결과: 6400 - PX (Post Exchange)
```

### 건물 이름으로 검색
```
검색창에 입력: "hospital"
결과: 6500 - Brian Allgood Army Community Hospital
```

### 카테고리로 검색
```
검색창에 입력: "쇼핑"
결과: 모든 쇼핑 시설 목록
```

## 대량 데이터 입력 템플릿

### Excel/CSV 템플릿

| Building Number | Name | Category | Latitude | Longitude | Description |
|----------------|------|----------|----------|-----------|-------------|
| 6400 | PX | 쇼핑 | 36.9700 | 127.0380 | 군 매점 |
| 6401 | Commissary | 쇼핑 | 36.9690 | 127.0390 | 군 식료품점 |
| 6500 | Hospital | 병원 | 36.9710 | 127.0360 | 종합병원 |

### JSON 형식
```json
[
  {
    "buildingNumber": "6400",
    "name": "PX (Post Exchange)",
    "category": "쇼핑",
    "latitude": 36.9700,
    "longitude": 127.0380,
    "description": "군 매점"
  },
  {
    "buildingNumber": "6401",
    "name": "Commissary",
    "category": "쇼핑",
    "latitude": 36.9690,
    "longitude": 127.0390,
    "description": "군 식료품점"
  }
]
```

## 좌표 확인 방법

### 방법 1: 앱 내에서 확인
1. 개발자 도구 열기 (F12)
2. Console에서 실행:
```javascript
map.on('click', (e) => {
  console.log(`Latitude: ${e.lngLat.lat}, Longitude: ${e.lngLat.lng}`);
});
```

### 방법 2: Google Maps 사용
1. Google Maps에서 위치 우클릭
2. 좌표 복사

### 방법 3: GPS 앱 사용
스마트폰 GPS 앱으로 현장에서 직접 측정

## 보안 고려사항

⚠️ **중요**: 군사 시설 정보는 민감할 수 있습니다.

1. **접근 제어**: 앱에 인증 기능 추가
2. **데이터 암호화**: 민감한 건물 정보는 암호화
3. **권한 관리**: 사용자 역할별 접근 제한
4. **배포 주의**: 공개 저장소에 실제 데이터 업로드 금지

## 데이터 업데이트 주기

권장 업데이트 주기:
- 신규 건물: 즉시 추가
- 건물 용도 변경: 분기별
- 좌표 보정: 연 1회

## 문제 해결

### 검색이 안 될 때
1. 건물 번호가 정확한지 확인
2. 오타가 없는지 확인
3. 개발자 콘솔에서 에러 확인

### 좌표가 정확하지 않을 때
1. 위도/경도 순서 확인 (Latitude, Longitude)
2. 소수점 자릿수 확인 (최소 4자리 권장)
3. 지도에서 마커 위치 확인

## 예시: 완전한 데이터 입력

```typescript
// src/services/localBuildingService.ts
export const CAMP_HUMPHREYS_BUILDINGS: BuildingData[] = [
  // 쇼핑 시설
  { buildingNumber: '6400', name: 'PX (Post Exchange)', category: '쇼핑', latitude: 36.9700, longitude: 127.0380, description: '군 매점' },
  { buildingNumber: '6401', name: 'Commissary', category: '쇼핑', latitude: 36.9690, longitude: 127.0390, description: '군 식료품점' },
  
  // 의료 시설
  { buildingNumber: '6500', name: 'Brian Allgood Army Community Hospital', category: '병원', latitude: 36.9710, longitude: 127.0360, description: '종합병원' },
  { buildingNumber: '6501', name: 'Dental Clinic', category: '병원', latitude: 36.9708, longitude: 127.0362, description: '치과' },
  
  // 체육 시설
  { buildingNumber: '6600', name: 'Warrior Fitness Center', category: '체육시설', latitude: 36.9680, longitude: 127.0400, description: '체력단련장' },
  
  // 교육 시설
  { buildingNumber: '6700', name: 'Humphreys Elementary School', category: '학교', latitude: 36.9720, longitude: 127.0370, description: '초등학교' },
  
  // 식음 시설
  { buildingNumber: '6800', name: 'Dining Facility', category: '음식점', latitude: 36.9695, longitude: 127.0385, description: '식당' },
  { buildingNumber: '6801', name: 'Starbucks', category: '음식점', latitude: 36.9698, longitude: 127.0383, description: '카페' },
  
  // 숙소
  { buildingNumber: '6900', name: 'Barracks A', category: '숙소', latitude: 36.9705, longitude: 127.0395, description: '병영 A동' },
  { buildingNumber: '6901', name: 'Barracks B', category: '숙소', latitude: 36.9703, longitude: 127.0393, description: '병영 B동' },
];
```

이제 건물 번호로 검색하면 해당 건물을 찾을 수 있습니다! 🏢
