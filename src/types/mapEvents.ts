import type { MapMouseEvent, MapTouchEvent } from 'react-map-gl';

export type MapContextMenuEvent = MapMouseEvent & {
  preventDefault: () => void;
};

export type MapLongPressEvent = MapTouchEvent & {
  point?: { x: number; y: number };
};
