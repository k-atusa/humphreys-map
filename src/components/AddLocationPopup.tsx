import { useState } from 'react';
import { addBuilding } from '../services/apiService';
import './AddLocationPopup.css';

interface TimeSlot {
  open: string;
  close: string;
}

interface BusinessHours {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

interface AddLocationPopupProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'shopping', label: '쇼핑' },
  { value: 'food', label: '음식점' },
  { value: 'medical', label: '의료시설' },
  { value: 'education', label: '교육시설' },
  { value: 'sports', label: '체육시설' },
  { value: 'administrative', label: '행정시설' },
  { value: 'barracks', label: '거주시설' },
  { value: 'entertainment', label: '엔터테인먼트' },
  { value: 'service', label: '서비스' },
  { value: 'transportation', label: '교통' },
  { value: 'military', label: '군사시설' },
  { value: 'religious', label: '종교시설' },
  { value: 'recreation', label: '레크리에이션' },
  { value: 'other', label: '기타' }
];

const WEEKDAYS = [
  { key: 'monday', label: '월요일' },
  { key: 'tuesday', label: '화요일' },
  { key: 'wednesday', label: '수요일' },
  { key: 'thursday', label: '목요일' },
  { key: 'friday', label: '금요일' },
  { key: 'saturday', label: '토요일' },
  { key: 'sunday', label: '일요일' }
] as const;

export default function AddLocationPopup({ latitude, longitude, onClose, onSuccess }: AddLocationPopupProps) {
  const [formData, setFormData] = useState({
    buildingNumber: '',
    name: '',
    category: 'other',
    contact: '',
    description: ''
  });
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addTimeSlot = (day: keyof BusinessHours) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { open: '09:00', close: '18:00' }]
    }));
  };

  const removeTimeSlot = (day: keyof BusinessHours, index: number) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: prev[day]?.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (day: keyof BusinessHours, index: number, field: 'open' | 'close', value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: prev[day]?.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // 필수 필드 검증
    if (!formData.name) {
      setError('장소 이름은 필수 입력 항목입니다.');
      setIsSubmitting(false);
      return;
    }

    // businessHours가 비어있지 않은지 확인
    const hasBusinessHours = Object.values(businessHours).some(slots => slots && slots.length > 0);

    try {
      const result = await addBuilding({
        buildingNumber: formData.buildingNumber || `AUTO-${Date.now()}`,
        name: formData.name,
        category: formData.category,
        businessHours: hasBusinessHours ? businessHours : undefined,
        contact: formData.contact || undefined,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        latitude,
        longitude,
        description: formData.description || undefined
      });

      if (result) {
        alert('장소가 성공적으로 추가되었습니다!');
        onSuccess();
        onClose();
      } else {
        setError('장소 추가에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('장소 추가 오류:', error);
      const errorMessage = error.message || '서버 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 인증 에러인 경우 추가 안내
      if (errorMessage.includes('인증') || errorMessage.includes('권한')) {
        alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-location-overlay" onClick={onClose}>
      <div className="add-location-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>📍 새 장소 추가</h2>
          <button className="popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="popup-coordinates">
          <span>위도: {latitude.toFixed(6)}</span>
          <span>경도: {longitude.toFixed(6)}</span>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="form-row">
            <label htmlFor="buildingNumber">
              건물 번호
              <span className="optional">(선택사항)</span>
            </label>
            <input
              type="text"
              id="buildingNumber"
              name="buildingNumber"
              value={formData.buildingNumber}
              onChange={handleChange}
              placeholder="예: 1001"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <label htmlFor="name">
              장소 이름 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: Post Exchange (PX)"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <label htmlFor="category">카테고리</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label className="section-label">
              영업 시간
              <span className="optional">(선택사항)</span>
            </label>
            <div className="business-hours-container">
              {WEEKDAYS.map(({ key, label }) => (
                <div key={key} className="day-hours">
                  <div className="day-header">
                    <span className="day-label">{label}</span>
                    <button
                      type="button"
                      className="btn-add-slot"
                      onClick={() => addTimeSlot(key)}
                      disabled={isSubmitting}
                    >
                      + 시간 추가
                    </button>
                  </div>
                  {businessHours[key]?.map((slot, index) => (
                    <div key={index} className="time-slot">
                      <input
                        type="time"
                        value={slot.open}
                        onChange={(e) => updateTimeSlot(key, index, 'open', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <span>~</span>
                      <input
                        type="time"
                        value={slot.close}
                        onChange={(e) => updateTimeSlot(key, index, 'close', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="btn-remove-slot"
                        onClick={() => removeTimeSlot(key, index)}
                        disabled={isSubmitting}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="contact">
              연락처
              <span className="optional">(선택사항)</span>
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="예: 031-690-1234"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">
              설명
              <span className="optional">(선택사항)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="장소에 대한 추가 설명을 입력하세요"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {error && <div className="popup-error">{error}</div>}

          <div className="popup-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '추가 중...' : '장소 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
