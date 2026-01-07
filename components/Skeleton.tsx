import React from 'react';

interface SkeletonProps {
    variant?: 'text' | 'card' | 'circle';
    width?: string;
    height?: string;
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = ''
}) => {
    const baseClasses = 'animate-pulse bg-stone-200 rounded';

    const variantClasses = {
        text: 'h-4 rounded',
        card: 'h-24 rounded-xl',
        circle: 'rounded-full'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Pre-built skeleton patterns
export const VerseCardSkeleton: React.FC = () => (
    <div className="bg-white/60 border border-stone-warm/30 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
            <Skeleton variant="text" width="80px" height="12px" />
            <Skeleton variant="circle" width="24px" height="24px" />
        </div>
        <Skeleton variant="text" width="100%" height="16px" />
        <Skeleton variant="text" width="90%" height="16px" />
        <Skeleton variant="text" width="70%" height="16px" />
    </div>
);

export const MessageSkeleton: React.FC = () => (
    <div className="flex items-start space-x-3 max-w-[85%]">
        <div className="bg-white/80 rounded-2xl p-4 space-y-2 flex-1">
            <Skeleton variant="text" width="100%" height="14px" />
            <Skeleton variant="text" width="95%" height="14px" />
            <Skeleton variant="text" width="60%" height="14px" />
        </div>
    </div>
);

export default Skeleton;
