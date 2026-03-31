interface BannerProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Banner = ({ 
  title = "ULTIMATEWATCH", 
  subtitle, 
  className = "" 
}: BannerProps) => {
  return (
    <div className={`relative mb-10 w-full h-fit py-12 flex flex-col justify-center items-center text-center px-4 bg-purple-main/30 backdrop-blur-xl border-y border-purple-main/10 shadow-[inset_0_0_50px_rgba(168,85,247,0.3),0_0_30px_rgba(168,85,247,0.15)] ${className}`}>
      <div className="absolute inset-0 bg-linear-to-r from-purple-main/10 via-purple-main/30 to-purple-main/10 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-0.5 bg-purple-main shadow-[0_0_15px_#A855F7,0_0_5px_#A855F7]" />
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="relative text-8xl text-white font-bold font-inter">
            {title}
          </h1>
          
          {subtitle && (
            <h2 className="relative mt-4 text-4xl text-white font-semibold font-inter uppercase">
              {subtitle}
            </h2>
          )}
        </div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-main shadow-[0_0_15px_#A855F7,0_0_5px_#A855F7]" />
    </div>
  );
};