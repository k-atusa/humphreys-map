import { Request, Response } from 'express';

// OSRM 서버 - 각 교통수단별 서버
// 공개 OSRM 서버들 (무료)
const OSRM_SERVERS: Record<string, { url: string; profile: string }> = {
  driving: {
    url: 'https://router.project-osrm.org',
    profile: 'driving'
  },
  cycling: {
    url: 'https://routing.openstreetmap.de/routed-bike',
    profile: 'driving'  // routed-bike 서버는 profile 이름이 driving
  },
  walking: {
    url: 'https://routing.openstreetmap.de/routed-foot',
    profile: 'driving'  // routed-foot 서버는 profile 이름이 driving
  }
};

export const getRoute = async (req: Request, res: Response) => {
  try {
    const { origin, destination, mode = 'driving' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: '출발지와 도착지가 필요합니다.'
      });
    }

    const server = OSRM_SERVERS[mode as string] || OSRM_SERVERS.driving;
    
    // OSRM API 호출
    const url = `${server.url}/route/v1/${server.profile}/${origin};${destination}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    
    console.log(`Routing request: mode=${mode}, url=${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OSRM API error:', response.status, errorText);
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({
      success: false,
      error: '경로를 찾을 수 없습니다.'
    });
  }
};
