interface CardProps {
  className?: string;
  title?: string;
  desc?: string;
  img?: React.ReactNode;
}

export default function FeatureCard({ className = "", title = "", desc = "", img }: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 w-[350px] h-[185px] rounded-lg drop-shadow-md text-center shrink-0 p-4 flex flex-col justify-center items-center ${className}`}
    >
      {img && <div className="mb-3">{img}</div>}
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-600">{desc}</p>
    </div>
  );
}
