'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type LoadingVariant = 'spinner' | 'dots' | 'text' | 'button';
export type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: {
    spinner: 'h-4 w-4',
    dots: 'h-1.5 w-1.5',
    text: 'text-sm',
    container: 'p-2',
  },
  md: {
    spinner: 'h-8 w-8',
    dots: 'h-2 w-2',
    text: 'text-base',
    container: 'p-4',
  },
  lg: {
    spinner: 'h-12 w-12',
    dots: 'h-3 w-3',
    text: 'text-lg',
    container: 'p-8',
  },
};

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
  fullScreen = false,
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-gray-50'
    : `flex items-center justify-center ${sizeClasses[size].container}`;

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size].spinner}`}
          />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            <div
              className={`animate-bounce rounded-full bg-blue-500 ${sizeClasses[size].dots}`}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={`animate-bounce rounded-full bg-blue-500 ${sizeClasses[size].dots}`}
              style={{ animationDelay: '150ms' }}
            />
            <div
              className={`animate-bounce rounded-full bg-blue-500 ${sizeClasses[size].dots}`}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        );

      case 'text':
        return (
          <div className={`font-medium text-gray-600 ${sizeClasses[size].text}`}>
            {text || '読み込み中...'}
          </div>
        );

      case 'button':
        return (
          <div className="flex items-center justify-center gap-2">
            <div
              className={`animate-spin rounded-full border-2 border-white border-t-transparent ${sizeClasses[size].spinner}`}
            />
            <span className={`text-white ${sizeClasses[size].text}`}>{text || '処理中...'}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {renderLoader()}
        {text && variant !== 'text' && variant !== 'button' && (
          <p className={`text-gray-600 ${sizeClasses[size].text}`}>{text}</p>
        )}
      </div>
    </div>
  );
};

interface LoadingWithIconProps extends LoadingProps {
  icon?: boolean;
}

export const LoadingWithIcon: React.FC<LoadingWithIconProps> = ({
  icon = true,
  size = 'md',
  text,
  className = '',
}) => {
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {icon && <Loader2 className={`animate-spin text-blue-600 ${iconSizeClasses[size]}`} />}
      {text && <span className={`text-gray-600 ${sizeClasses[size].text}`}>{text}</span>}
    </div>
  );
};

export const LoadingOverlay: React.FC<LoadingProps> = (props) => {
  return (
    <>
      <div className="bg-opacity-50 fixed inset-0 z-40 bg-black" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <Loading {...props} />
        </div>
      </div>
    </>
  );
};
