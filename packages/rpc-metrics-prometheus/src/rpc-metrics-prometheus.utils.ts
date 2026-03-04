import { JsonRpcRequest } from '@lido-nestjs/execution';
import { RpcProviderWithEventEmitter } from './rpc-metrics-prometheus.types';
import { RPC_METRIC_VALUES } from './rpc-metrics-prometheus.constants';

const IPV4_WITH_PORT_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/;
const PROTOCOL_REGEX = /^[a-z]+:\/\//i;
const INTEGER_REGEX = /^-?\d+$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isRpcProviderWithEventEmitter(
  value: unknown,
): value is RpcProviderWithEventEmitter {
  if (!isRecord(value)) return false;

  const emitter = value.eventEmitter;
  if (!isRecord(emitter)) return false;

  return typeof emitter.on === 'function' && typeof emitter.off === 'function';
}

export function normalizeProvider(domain: string): string {
  if (!domain) {
    return RPC_METRIC_VALUES.UNKNOWN_PROVIDER;
  }

  const host = extractHost(domain);
  if (!host) {
    return RPC_METRIC_VALUES.UNKNOWN_PROVIDER;
  }

  if (IPV4_WITH_PORT_REGEX.test(host)) {
    return host;
  }

  const [hostname] = splitHostAndPort(host);

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }

  return hostname || RPC_METRIC_VALUES.UNKNOWN_PROVIDER;
}

export function calculatePayloadSize(data: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  } catch {
    return 0;
  }
}

export function getRequestKey(requests: JsonRpcRequest[]): string {
  return requests.map((request) => `${request.id}`).join(',');
}

export function normalizeMethod(method: unknown): string {
  if (typeof method !== 'string') {
    return 'unknown';
  }

  return method || 'unknown';
}

function extractHost(domain: string): string {
  const withoutProtocol = domain
    .trim()
    .toLowerCase()
    .replace(PROTOCOL_REGEX, '');
  if (!withoutProtocol) {
    return '';
  }

  const withoutPath = withoutProtocol.split('/')[0];
  const withoutQuery = withoutPath.split('?')[0];

  return withoutQuery.split('#')[0];
}

export function extractHttpErrorCode(error: unknown): string {
  if (!isRecord(error)) return '';
  const status = error.status;
  if (typeof status !== 'number' && typeof status !== 'string') return '';
  return String(status).startsWith('4')
    ? RPC_METRIC_VALUES.RESPONSE_CLIENT_ERROR
    : RPC_METRIC_VALUES.RESPONSE_SERVER_ERROR;
}

export function extractRpcErrorCode(error: unknown): string {
  const code =
    extractCode(error) ??
    extractCode(isRecord(error) ? error.error : undefined);

  if (code === undefined) return '';

  const str = String(code);
  return INTEGER_REGEX.test(str) ? str : '';
}

function extractCode(value: unknown): string | number | undefined {
  if (!isRecord(value)) return undefined;
  const code = value.code;
  return typeof code === 'number' || typeof code === 'string'
    ? code
    : undefined;
}

function splitHostAndPort(host: string): [string, string] {
  const segments = host.split(':');
  if (segments.length === 2 && INTEGER_REGEX.test(segments[1])) {
    return [segments[0], segments[1]];
  }

  return [host, ''];
}
