// Railway settings for the docs site (Infrastructure as Code; replaces railway.json, which Railway stops reading on
// 2026-12-01). Railway does not read this file on deploy: preview with `railway config plan`, then
// `railway config apply`. Partial mode: this file manages only the prettydocs service.
import { defineRailway, github, project, service } from 'railway/iac';

export const partial = 'prettydocs';

export default defineRailway(() => {
  const web = service('prettydocs', {
    source: github('Paradox2102/PrettyDocs', { branch: 'main' }),
    build: { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' },
    deploy: {
      healthcheckPath: '/',
      // No restartPolicyType: Railway's default is ON_FAILURE with 10 restarts, and it stores the default as null,
      // so setting it here would show as a change on every plan.
      // The limits Railway set when the service was made (8 vCPU, 8 GB); a static Caddy site uses a small part.
      limitOverride: { containers: { cpu: 8, memoryBytes: 8_000_000_000 } },
    },
    // Caddy listens on $PORT, which is 8080 on Railway.
    domains: [{ domain: 'docs.team2102.org', port: 8080 }],
  });

  return project('PrettyDocs', { resources: [web] });
});
