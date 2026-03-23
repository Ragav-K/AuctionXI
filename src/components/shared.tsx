import React from 'react';
import { motion } from 'motion/react';
import type { Screen } from '../types/auction';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  glow = false,
  disabled = false
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; 
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-neon-green text-navy-deep font-bold hover:bg-white transition-all duration-300',
    secondary: 'bg-gold text-navy-deep font-bold hover:bg-white transition-all duration-300',
    outline: 'border border-white/20 text-white hover:bg-white/10 transition-all duration-300',
    ghost: 'text-white/60 hover:text-white transition-all duration-300'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`px-8 py-4 rounded-xl flex items-center justify-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${variants[variant]} ${glow ? (variant === 'primary' ? 'glow-green' : 'glow-gold') : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
};

interface InputProps {
  label: string;
  placeholder: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
  value?: string | number;
  onChange?: (value: string) => void;
  name?: string;
}

export const Input = ({ label, placeholder, type = 'text', icon: Icon, value, onChange, name }: InputProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div className="space-y-2 w-full">
      <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />}
        <input 
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 ${Icon ? 'pl-12' : 'px-4'} pr-4 focus:outline-none focus:border-neon-green/50 transition-colors placeholder:text-white/20`}
        />
      </div>
    </div>
  );
};

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`glass-card rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);
