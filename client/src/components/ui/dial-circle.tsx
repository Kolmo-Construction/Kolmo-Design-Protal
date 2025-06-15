import React from 'react';
import { cn } from '@/lib/utils';

interface DialCircleProps {
  value: number;
  maxValue?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  showPercentage?: boolean;
  label?: string;
  sublabel?: string;
  strokeWidth?: number;
  className?: string;
}

const sizeConfig = {
  sm: { diameter: 80, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { diameter: 100, fontSize: 'text-xl', labelSize: 'text-sm' },
  lg: { diameter: 120, fontSize: 'text-2xl', labelSize: 'text-sm' },
  xl: { diameter: 140, fontSize: 'text-3xl', labelSize: 'text-base' }
};

const colorConfig = {
  primary: {
    stroke: 'stroke-primary',
    fill: 'fill-primary',
    text: 'text-primary'
  },
  accent: {
    stroke: 'stroke-accent',
    fill: 'fill-accent', 
    text: 'text-accent'
  },
  success: {
    stroke: 'stroke-green-500',
    fill: 'fill-green-500',
    text: 'text-green-600'
  },
  warning: {
    stroke: 'stroke-yellow-500',
    fill: 'fill-yellow-500',
    text: 'text-yellow-600'
  },
  destructive: {
    stroke: 'stroke-destructive',
    fill: 'fill-destructive',
    text: 'text-destructive'
  }
};

export function DialCircle({
  value,
  maxValue = 100,
  size = 'md',
  color = 'accent',
  showPercentage = true,
  label,
  sublabel,
  strokeWidth = 8,
  className
}: DialCircleProps) {
  const config = sizeConfig[size];
  const colors = colorConfig[color];
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const radius = (config.diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
        <svg
          width={config.diameter}
          height={config.diameter}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted opacity-20"
          />
          
          {/* Progress circle */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn(colors.stroke, "transition-all duration-1000 ease-out")}
            style={{
              transformOrigin: 'center',
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", config.fontSize, colors.text)}>
            {showPercentage ? `${Math.round(percentage)}%` : value}
          </span>
          {sublabel && (
            <span className={cn("text-muted-foreground", config.labelSize, "mt-1")}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      
      {label && (
        <span className={cn("text-center font-medium mt-2", config.labelSize)}>
          {label}
        </span>
      )}
    </div>
  );
}