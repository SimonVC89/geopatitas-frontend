import '@testing-library/jest-dom';

// jsdom no implementa scrollTo
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
