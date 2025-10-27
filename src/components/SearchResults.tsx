import { useState } from 'react';
import './SearchResults.css';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  category: string;
  distance?: string;
  latitude: number;
  longitude: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export default function SearchResults({ results, isOpen, onClose, onSelectResult }: SearchResultsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = currentY - startY;
    if (diff > 100) {
      onClose();
    }
    
    setStartY(0);
    setCurrentY(0);
  };

  const handleResultClick = (result: SearchResult) => {
    onSelectResult(result);
  };

  return (
    <>
      <div 
        className={`search-results-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      <div 
        className={`search-results ${isOpen ? 'open' : ''}`}
        style={{
          transform: isDragging && currentY > startY 
            ? `translateY(${currentY - startY}px)` 
            : undefined
        }}
      >
        <div 
          className="search-results-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="handle-bar"></div>
        </div>

        <div className="search-results-header">
          <h3 className="results-title">검색 결과 ({results.length})</h3>
          <button className="close-button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="search-results-list">
          {results.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            results.map((result) => (
              <div 
                key={result.id} 
                className="result-item"
                onClick={() => handleResultClick(result)}
              >
                <div className="result-icon">{getCategoryIcon(result.category)}</div>
                <div className="result-info">
                  <div className="result-name">{result.name}</div>
                  <div className="result-category">{result.category}</div>
                  <div className="result-address">{result.address}</div>
                </div>
                {result.distance && (
                  <div className="result-distance">{result.distance}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function getCategoryIcon(category: string): string {
  const iconMap: { [key: string]: string } = {
    '카페': '☕',
    '음식점': '🍴',
    '편의점': '🏪',
    '병원': '🏥',
    '약국': '💊',
    '은행': '🏦',
    '주유소': '⛽',
    '주차장': '🅿️',
    '학교': '🏫',
    '관공서': '🏛️',
    '숙박': '🏨',
    '문화시설': '🎭',
    '체육시설': '⚽',
    '쇼핑': '🛍️',
    'default': '📍'
  };
  
  return iconMap[category] || iconMap['default'];
}
