interface HeroBannerProps {
  image: string;
  alt: string;
  title?: string;
  overlay?: boolean;
}

export default function HeroBanner({ image, alt, title, overlay = true }: HeroBannerProps) {
  return (
    <div className="relative w-full" data-testid="hero-banner">
      <div className="overflow-hidden max-h-56 sm:max-h-72">
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover object-center"
          data-testid="img-hero-banner"
        />
      </div>
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-7xl mx-auto">
            <h1
              className="font-serif text-2xl sm:text-4xl lg:text-5xl text-white leading-tight drop-shadow-lg"
              data-testid="text-hero-title"
            >
              {title}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}
