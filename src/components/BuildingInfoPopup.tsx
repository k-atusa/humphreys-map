import { SearchResult } from './SearchResults';
import './BuildingInfoPopup.css';

interface BuildingInfoPopupProps {
  building: SearchResult;
  onClose: () => void;
}

export default function BuildingInfoPopup({ building, onClose }: BuildingInfoPopupProps) {
  return (
    <div className="building-info-overlay" onClick={onClose}>
      <div className="building-info-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{building.name}</h2>
          <button className="popup-close" onClick={onClose}>✕</button>
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
              <span className="info-value">{building.businessHours}</span>
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
          <button className="btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
