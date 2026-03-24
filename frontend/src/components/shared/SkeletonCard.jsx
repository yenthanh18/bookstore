export default function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 animate-pulse flex flex-col h-full border border-outline-variant/5 shadow-sm">
      <div className="aspect-[3/4] rounded-md bg-surface-container-low mb-6 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low translate-x-[-100%] animate-[shimmer_1.5s_infinite]"></div>
      </div>
      <div className="h-3 bg-surface-container-low rounded w-1/4 mb-4"></div>
      <div className="h-5 bg-surface-container-low rounded w-3/4 mb-2"></div>
      <div className="h-5 bg-surface-container-low rounded w-2/4 mb-4"></div>
      <div className="h-4 bg-surface-container-low rounded w-1/2 mb-6"></div>
      <div className="mt-auto flex justify-between items-center pt-2">
        <div className="h-6 bg-surface-container-low rounded w-16"></div>
        <div className="h-10 w-10 bg-surface-container-low rounded-full"></div>
      </div>
    </div>
  );
}
