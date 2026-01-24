import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

export interface SearchResultItem {
  id: string;
  buildingNumber?: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onMenuClick: () => void;
  searchResults?: SearchResultItem[];
  onSelectResult?: (result: SearchResultItem) => void;
}

export default function SearchBar({ onSearch, onMenuClick, searchResults = [], onSelectResult }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 입력할 때마다 디바운스로 검색 실행
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(() => {
      onSearch(query);
    }, 200); // 200ms 디바운스

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, onSearch]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 결과가 도착하면 드롭다운 표시
  useEffect(() => {
    if (query.trim().length > 0 && searchResults.length > 0) {
      setIsDropdownVisible(true);
    }
  }, [searchResults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 즉시 검색 실행
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setIsDropdownVisible(false);
    onSearch(''); // 검색 결과도 초기화
  };

  const handleResultClick = (result: SearchResultItem) => {
    setIsDropdownVisible(false);
    onSelectResult?.(result);
  };

  // 실제 표시 여부
  const showResults = isDropdownVisible && query.trim().length > 0 && searchResults.length > 0;

  return (
    <div className="search-bar-container" ref={containerRef}>
      <form className={`search-bar ${isFocused ? 'focused' : ''} ${showResults ? 'has-results' : ''}`} onSubmit={handleSubmit}>
        <button type="button" className="menu-button" aria-label="메뉴" onClick={onMenuClick}>
          ☰
        </button>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="장소, 건물명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (query.trim() && searchResults.length > 0) {
                setIsDropdownVisible(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
          />
          {query && (
            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
              aria-label="지우기"
            >
              ✕
            </button>
          )}
        </div>
        <button type="button" className="voice-button" aria-label="음성 검색">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
      </form>

      {/* 검색 결과 드롭다운 */}
      {showResults && (
        <div className="search-results-dropdown">
          <div className="search-results-count">
            검색 결과 {searchResults.length}건
          </div>
          <ul className="search-results-list">
            {searchResults.map((result) => (
              <li 
                key={result.id} 
                className="search-result-item"
                onMouseDown={() => handleResultClick(result)}
              >
                <div className="result-icon">📍</div>
                <div className="result-info">
                  <div className="result-name">
                    {result.buildingNumber && (
                      <span className="result-building-number">{result.buildingNumber}</span>
                    )}
                    {result.name}
                  </div>
                  <div className="result-category">{result.category}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
