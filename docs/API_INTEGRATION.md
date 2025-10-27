# API 연동 가이드

## 현재 구현된 API: Nominatim (OpenStreetMap)

현재 앱은 무료 OpenStreetMap Nominatim API를 사용하고 있습니다.

### 주요 특징
- ✅ **무료 사용 가능**
- ✅ **전세계 데이터**
- ⚠️ **사용 제한**: 초당 1회 요청 제한 (공개 서버)
- ⚠️ **정확도**: 군사 시설 내부 정보는 제한적

### 현재 구현 위치
`src/services/searchService.ts` 파일에 구현되어 있습니다.

## 다른 API로 변경하는 방법

### 1. Google Places API (추천)

더 정확한 검색과 상세 정보를 원하는 경우:

```bash
# Google Maps API 키 발급
# https://developers.google.com/maps/documentation/places/web-service/get-api-key
```

`.env` 파일에 추가:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```

`src/services/searchService.ts` 수정 예시:
```typescript
const GOOGLE_PLACES_API = 'https://maps.googleapis.com/maps/api/place';

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  const response = await fetch(
    `${GOOGLE_PLACES_API}/textsearch/json?query=${encodeURIComponent(query)}&location=36.9686,127.0374&radius=5000&key=${apiKey}`
  );
  
  const data = await response.json();
  
  return data.results.map((place: any) => ({
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    category: place.types[0],
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng
  }));
}
```

### 2. Mapbox Geocoding API

Mapbox를 이미 사용 중이라면:

```typescript
export async function searchPlaces(query: string): Promise<SearchResult[]> {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=127.0374,36.9686&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  return data.features.map((feature: any) => ({
    id: feature.id,
    name: feature.text,
    address: feature.place_name,
    category: feature.properties.category || '장소',
    latitude: feature.center[1],
    longitude: feature.center[0]
  }));
}
```

### 3. 자체 백엔드 API

군부대 내부 시설 데이터베이스를 구축한 경우:

```typescript
export async function searchPlaces(query: string): Promise<SearchResult[]> {
  const response = await fetch(
    `https://your-backend-api.com/api/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`
      }
    }
  );
  
  const data = await response.json();
  return data.results;
}
```

## API 사용 제한 및 최적화

### Debouncing 추가 (검색 최적화)

`src/components/SearchBar.tsx`에 디바운싱 추가:

```typescript
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

// 500ms 후에 검색 실행
const debouncedSearch = useCallback(
  debounce((query: string) => {
    onSearch(query);
  }, 500),
  []
);
```

### 캐싱 추가

검색 결과를 로컬에 캐시:

```typescript
const searchCache = new Map<string, SearchResult[]>();

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  // 캐시 확인
  if (searchCache.has(query)) {
    return searchCache.get(query)!;
  }
  
  // API 호출
  const results = await fetchFromAPI(query);
  
  // 캐시 저장
  searchCache.set(query, results);
  
  return results;
}
```

## 테스트

개발 서버 실행 후 검색창에서 다음을 검색해보세요:
- "hospital" - 병원 검색
- "school" - 학교 검색
- "Pyeongtaek" - 평택 지역 검색

## 주의사항

1. **API 키 보안**: `.env` 파일은 `.gitignore`에 포함되어 있습니다.
2. **요청 제한**: 각 API의 사용 제한을 확인하고 준수하세요.
3. **에러 처리**: 네트워크 오류나 API 제한 초과 시 적절한 에러 메시지 표시.

## 현재 상태

✅ Nominatim API 연동 완료
✅ 실시간 검색 기능
✅ 지도 마커 표시
✅ 검색 결과 오버레이

다른 API로 변경하려면 `src/services/searchService.ts` 파일만 수정하면 됩니다!
