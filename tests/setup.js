// Mock browser APIs
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock WebGL context
class WebGLRenderingContext {}
global.WebGLRenderingContext = WebGLRenderingContext;

// Mock canvas
class HTMLCanvasElement {
    getContext() {
        return new WebGLRenderingContext();
    }
}
global.HTMLCanvasElement = HTMLCanvasElement;

// Mock document methods
document.createElement = (tag) => {
    if (tag === 'canvas') {
        return new HTMLCanvasElement();
    }
    return {};
};

// Mock window properties
global.innerWidth = 1920;
global.innerHeight = 1080; 