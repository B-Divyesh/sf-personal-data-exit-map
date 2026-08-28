import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('static release policy', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8'));

  it('sets content, frame, permission, MIME, and immutable asset policies', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
    expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
  });

  it('serves the designed 404 with a 404 response override', () => {
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
    const page = readFileSync('404.html', 'utf8');
    expect(page).toContain('<h1>This page is not on the map</h1>');
  });

  it('does not claim offline readiness before registration completes', () => {
    const page = readFileSync('index.html', 'utf8');
    expect(page).toContain('Preparing offline access…');
    expect(page).not.toContain('<span>Ready offline</span>');
  });
});
