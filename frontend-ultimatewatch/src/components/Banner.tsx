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
    <div className={`relative mb-10 w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center text-center px-4 ${className}`}>
      <h1 className="relative text-8xl text-white font-bold font-inter">
        {title}
      </h1>
      
      {subtitle && (
        <h2 className="relative mt-4 text-4xl text-white font-semibold font-inter uppercase">
          {subtitle}
        </h2>
      )}
    </div>
  );
};