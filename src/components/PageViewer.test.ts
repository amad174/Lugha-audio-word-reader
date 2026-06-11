import {
  displayRectToImageBox,
  getPageMetrics,
  hitTestBox,
} from '../utils/pageCoords';

describe('pageCoords', () => {
  test('getPageMetrics returns scale from displayed size', () => {
    const img = {
      naturalWidth: 800,
      naturalHeight: 1200,
      clientWidth: 400,
      clientHeight: 600,
    } as HTMLImageElement;

    expect(getPageMetrics(img)).toEqual({
      naturalWidth: 800,
      naturalHeight: 1200,
      displayWidth: 400,
      displayHeight: 600,
      scaleX: 0.5,
      scaleY: 0.5,
    });
  });

  test('displayRectToImageBox converts drag rect to image coordinates', () => {
    const metrics = {
      naturalWidth: 800,
      naturalHeight: 1200,
      displayWidth: 400,
      displayHeight: 600,
      scaleX: 0.5,
      scaleY: 0.5,
    };

    expect(displayRectToImageBox(100, 200, 50, 40, metrics)).toEqual({
      x: 200,
      y: 400,
      w: 100,
      h: 80,
    });
  });

  test('hitTestBox finds topmost box', () => {
    const metrics = {
      naturalWidth: 100,
      naturalHeight: 100,
      displayWidth: 100,
      displayHeight: 100,
      scaleX: 1,
      scaleY: 1,
    };
    const boxes = [
      { id: 'a', x: 0, y: 0, w: 50, h: 50 },
      { id: 'b', x: 10, y: 10, w: 20, h: 20 },
    ];

    expect(hitTestBox(15, 15, boxes, metrics)?.id).toBe('b');
    expect(hitTestBox(60, 60, boxes, metrics)).toBeNull();
  });
});
