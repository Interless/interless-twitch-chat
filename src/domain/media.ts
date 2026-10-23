export function isVideoUrl(url: string | null, mediaType?: 'image' | 'video'): boolean {
  return (
    url !== null &&
    (mediaType === 'video' ||
      (mediaType === undefined &&
        (/^data:video\/(?:webm|mp4)(?:;|,)/iu.test(url) || /\.(?:webm|mp4)(?:[?#]|$)/iu.test(url))))
  );
}
