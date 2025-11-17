import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'humphreys-map';
const COLLECTION_NAME = 'map';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * MongoDB 서버에 연결
 */
export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ MongoDB 연결 성공');
    
    db = client.db(DATABASE_NAME);
    return db;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    throw error;
  }
}

/**
 * MongoDB 데이터베이스 인스턴스 반환
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('MongoDB가 연결되지 않았습니다. connectToMongoDB()를 먼저 호출하세요.');
  }
  return db;
}

/**
 * map 컬렉션 반환
 */
export function getMapCollection(): Collection {
  const database = getDatabase();
  return database.collection(COLLECTION_NAME);
}

/**
 * MongoDB 연결 종료
 */
export async function disconnectFromMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB 연결 종료');
  }
}

// 프로세스 종료 시 연결 정리
process.on('SIGINT', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});
