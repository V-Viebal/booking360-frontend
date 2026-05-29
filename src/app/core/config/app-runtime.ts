export interface Booking360RuntimeConfig {
  readonly isLocal: boolean;
  readonly frontendOrigin: string;
  readonly apiBaseUrl: string;
  readonly authIssuer: string;
  readonly authOrigin: string;
  readonly apiResource: string;
  readonly clientId: string;
  readonly scope: string;
}

const productionOrigin = 'https://book360.hmz.one';
const productionApiBaseUrl = 'https://api-book360.hmz.one';
const localApiBaseUrl = 'http://localhost:5200';
const authOrigin = 'https://auth-book360.hmz.one';
const authIssuer = `${authOrigin}/oidc`;
const productionClientId = 'hfvtpxz1se1je14lr8pp0';
const localClientId = 'g1sm1vt7fhkvpch34099y';
const apiResource = 'https://api-book360.hmz.one';
const scope = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'read:profile',
  'write:profile',
  'read:listings',
  'write:listings',
  'read:customers',
  'write:customers',
  'read:projects',
  'write:projects',
  'read:map',
  'admin:all'
].join(' ');

function resolveFrontendOrigin(): string {
  if (typeof window === 'undefined') {
    return productionOrigin;
  }

  return window.location.origin;
}

function isLocalOrigin(origin: string): boolean {
  return origin.includes('localhost') || origin.includes('127.0.0.1');
}

export function getBooking360RuntimeConfig(): Booking360RuntimeConfig {
  const frontendOrigin = resolveFrontendOrigin();
  const isLocal = isLocalOrigin(frontendOrigin);

  return {
    isLocal,
    frontendOrigin,
    apiBaseUrl: isLocal ? localApiBaseUrl : productionApiBaseUrl,
    authIssuer,
    authOrigin,
    apiResource,
    clientId: isLocal ? localClientId : productionClientId,
    scope
  };
}
