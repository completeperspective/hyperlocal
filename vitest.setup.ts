import '@testing-library/jest-dom'
import { server } from './__tests__/mocks/server'

// ResizeObserver is not implemented in jsdom; stub it for Radix UI and other consumers
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
