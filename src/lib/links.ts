/**
 * External links. Every URL that reaches this file came from the API (an
 * ingest bot or an editor), so it is data, not trust: only http(s) leaves the
 * app, and a failure to open is swallowed rather than surfaced as a crash.
 */

import { Linking } from 'react-native';

export function isWebUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url);
}

export function openExternal(url: string | null | undefined): void {
  if (!isWebUrl(url)) return;
  Linking.openURL(url).catch(() => {});
}
