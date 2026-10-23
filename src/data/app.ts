/**
 * Mobile app release info shown on /app and in the home-page promo.
 *
 * Leave a store URL empty ('') while the app is not published there — the
 * page then shows a disabled "coming soon" badge instead of a link. Fill in
 * `version` once the first build ships.
 */
export const APP_RELEASE = {
  version: '' as string,
  ios: '' as string, // e.g. 'https://apps.apple.com/app/id0000000000'
  android: '' as string, // e.g. 'https://play.google.com/store/apps/details?id=ink.nihongo.app'
  apk: '' as string, // direct download, e.g. a GitHub release asset
  releasesUrl: 'https://github.com/tan-zhuo/Nihongo/releases',
}

export const APP_PUBLISHED = Boolean(APP_RELEASE.ios || APP_RELEASE.android || APP_RELEASE.apk)
