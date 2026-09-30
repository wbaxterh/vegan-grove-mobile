/** Routes into the media stack, in one place so a renamed screen is a one-line change. */

import { router } from 'expo-router';

export function openMedia(slug: string, options: { trailer?: boolean } = {}): void {
  router.push({
    pathname: '/media/[slug]',
    params: options.trailer ? { slug, trailer: '1' } : { slug },
  });
}

export function openCollection(slug: string): void {
  router.push({ pathname: '/media/collections/[slug]', params: { slug } });
}

export function openExplore(): void {
  router.push('/media/explore');
}

/** Back, or Home when the stack was entered straight from a link and has nothing behind it. */
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}
