import { getDisplayScale } from './PageViewer';

describe('getDisplayScale', () => {
  it('maps display pixels to natural image coordinates', () => {
    expect(getDisplayScale(400, 600, 800, 1200)).toEqual({ scaleX: 0.5, scaleY: 0.5 });
  });

  it('returns 1 when natural size is unknown', () => {
    expect(getDisplayScale(400, 600, 0, 0)).toEqual({ scaleX: 1, scaleY: 1 });
  });
});
