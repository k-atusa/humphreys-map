import { useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onMenuClick: () => void;
}

export default function SearchBar({ onSearch, onMenuClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="search-bar-container">
      <form className={`search-bar ${isFocused ? 'focused' : ''}`} onSubmit={handleSubmit}>
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
            onFocus={() => setIsFocused(true)}
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
    </div>
  );
}
