import { JSDOM } from 'jsdom';

export function setupJsdom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:5173/playground?level=1',
    pretendToBeVisual: true
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: dom.window.navigator,
      configurable: true,
      writable: true
    });
  } catch {
    // navigator might already be defined
  }

  const domGlobals = [
    'Element',
    'HTMLElement',
    'SVGElement',
    'SVGSVGElement',
    'Node',
    'Event',
    'CustomEvent',
    'MouseEvent',
    'KeyboardEvent',
    'MutationObserver',
    'DocumentFragment',
    'getComputedStyle',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'DOMParser',
    'XMLSerializer'
  ];

  for (const key of domGlobals) {
    if (dom.window[key] && !globalThis[key]) {
      globalThis[key] = dom.window[key];
    }
  }

  try {
    globalThis.localStorage = dom.window.localStorage;
  } catch {
    // ignore
  }

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // polyfill matchMedia
  if (!dom.window.matchMedia) {
    dom.window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    });
  }

  // polyfill SVG measurement methods for JSDOM
  const SVGElement = dom.window.SVGElement;
  if (SVGElement) {
    if (!SVGElement.prototype.getBBox) {
      SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
    }
    if (!SVGElement.prototype.getBoundingClientRect) {
      SVGElement.prototype.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100
      });
    }
  }

  const SVGSVGElement = dom.window.SVGSVGElement;
  if (SVGSVGElement && !SVGSVGElement.prototype.createSVGPoint) {
    SVGSVGElement.prototype.createSVGPoint = () => ({
      x: 0,
      y: 0,
      matrixTransform: () => ({ x: 0, y: 0 })
    });
  }

  // polyfill HTMLCanvasElement.getContext
  const HTMLCanvasElement = dom.window.HTMLCanvasElement;
  if (HTMLCanvasElement && !HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x, y, w, h) => ({ data: new Array(w * h * 4) }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 })
    });
  }

  return { dom, rootElement: dom.window.document.getElementById('root') };
}
