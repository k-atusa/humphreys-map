import { useState } from 'react';
import { SearchResult, BusinessHours } from './SearchResults';
import './BuildingInfoPopup.css';

interface BuildingInfoPopupProps {
  building: SearchResult;
  onClose: () => void;
}

const WEEKDAY_LABELS: Record<string, string> = {
  sunday: '일요일',
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일'
};

function formatBusinessHours(businessHours: BusinessHours | string | undefined) {
  if (!businessHours) return null;
  
  // 레거시 문자열 형식
  if (typeof businessHours === 'string') {
    return <span className="info-value">{businessHours}</span>;
  }
  
  // 요일 순서 정의: 일,월,화,수,목,금,토
  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // 새로운 객체 형식 - 요일 순서대로 정렬
  const days = dayOrder
    .map(day => [day, businessHours[day as keyof BusinessHours]] as const)
    .filter(([_, slots]) => slots && slots.length > 0);
  
  if (days.length === 0) return null;
  
  return (
    <div className="business-hours-display">
      {days.map(([day, slots]) => (
        <div key={day} className="hours-day">
          <span className={`day-name day-${day}`}>{WEEKDAY_LABELS[day]}</span>
          <div className="time-slots">
            {slots!.map((slot: any, index: number) => (
              <span key={index} className="time-slot-text">
                {slot.open} - {slot.close}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BuildingInfoPopup({ building, onClose }: BuildingInfoPopupProps) {
  const [isClosing, setIsClosing] = useState(false);

  const closeWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`building-info-overlay ${isClosing ? 'closing' : ''}`} onClick={closeWithAnimation}>
      <div className={`building-info-popup ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{building.name}</h2>
          <button className="popup-close" onClick={closeWithAnimation}>✕</button>
        </div>

        <div className="popup-content">
          {building.buildingNumber && (
            <div className="info-row">
              <span className="info-label">건물 번호</span>
              <span className="info-value">{building.buildingNumber}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">카테고리</span>
            <span className="info-value">{building.category}</span>
          </div>

          {building.businessHours && (
            <div className="info-row">
              <span className="info-label">영업 시간</span>
              {formatBusinessHours(building.businessHours)}
            </div>
          )}

          {building.contact && (
            <div className="info-row">
              <span className="info-label">연락처</span>
              <span className="info-value">{building.contact}</span>
            </div>
          )}

          {building.address && (
            <div className="info-row">
              <span className="info-label">주소</span>
              <span className="info-value">{building.address}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">위치</span>
            <span className="info-value">
              {building.latitude.toFixed(6)}, {building.longitude.toFixed(6)}
            </span>
          </div>

          {building.description && (
            <div className="info-row">
              <span className="info-label">설명</span>
              <span className="info-value">{building.description}</span>
            </div>
          )}
        </div>

        <div className="popup-actions">
          <button className="btn-primary" onClick={closeWithAnimation}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
