import Image from "next/image";

type AppLogoProps = {
  height?: number;
  width?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export default function AppLogo({
  height = 40,
  width,
  className = "",
  imageClassName = "",
  priority = false
}: AppLogoProps) {
  const containerWidth = width ?? Math.round(height * 2.8);

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: containerWidth, height }}>
      <Image
        src="/logoAnshapps.png"
        alt="ANSH Apps"
        fill
        sizes={`${containerWidth}px`}
        priority={priority}
        className={`object-contain object-center ${imageClassName}`}
      />
    </div>
  );
}
