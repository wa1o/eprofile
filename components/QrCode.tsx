export function QrCode({ url, size = 180 }: { url: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Codigo QR de tu EProfile" width={size} height={size} />;
}
