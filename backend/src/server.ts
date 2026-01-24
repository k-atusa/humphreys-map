import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongoDB } from './config/mongodb';
import buildingRoutes from './routes/buildings';
import authRoutes from './routes/auth';
import routingRoutes from './routes/routing';

// 환경 변수 로드
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// 헬스 체크 엔드포인트
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Humphreys Map API Server is running' });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/routing', routingRoutes);

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '요청한 엔드포인트를 찾을 수 없습니다.' });
});

// 서버 시작
async function startServer() {
  try {
    // MongoDB 연결
    await connectToMongoDB();
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
      console.log(`📍 API 엔드포인트: http://localhost:${PORT}/api/buildings`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();
