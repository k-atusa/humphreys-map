import './CategoryFilter.css';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CATEGORIES = [
  { value: 'all', label: '전체', icon: '🏢' },
  { value: 'food', label: '음식점', icon: '🍴' },
  { value: 'shopping', label: '쇼핑', icon: '🛍️' },
  { value: 'medical', label: '의료시설', icon: '🏥' },
  { value: 'sports', label: '체육시설', icon: '⚽' },
  { value: 'barracks', label: '거주시설', icon: '🏠' },
  { value: 'service', label: '서비스', icon: '🔧' },
  { value: 'education', label: '교육시설', icon: '🏫' },
  { value: 'administrative', label: '행정시설', icon: '🏛️' },
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const handleCategoryClick = (categoryValue: string | null) => {
    // 이미 선택된 카테고리를 다시 클릭하면 선택 해제 (아무것도 선택되지 않은 상태로)
    if (selectedCategory === categoryValue) {
      onSelectCategory(undefined as any); // 선택 해제 신호
    } else {
      onSelectCategory(categoryValue);
    }
  };

  return (
    <div className="category-filter">
      <div className="category-scroll">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            className={`category-pill ${selectedCategory === category.value ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.value)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-label">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
