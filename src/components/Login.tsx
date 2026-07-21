/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function Login({ onLogin, darkMode, setDarkMode }: LoginProps) {
  const [email, setEmail] = useState('contacto@ix.mx');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tus credenciales.');
      return;
    }
    setError('');
    onLogin();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-light-ivory dark:bg-[#051A14] text-enchanted-green dark:text-light-ivory transition-colors duration-300 p-6 md:p-12 font-sans">
      {/* Upper header with theme toggle */}
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center p-1 bg-enchanted-green/5 dark:bg-light-ivory/20 dark:backdrop-blur-sm border border-enchanted-green/15 dark:border-elevated-gold/40 shadow-sm shrink-0">
            <img src="/assets/images/IX_LOGOTIPO-01.svg" alt="IX" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <button
          onClick={() => setDarkMode(!darkMode)}
          id="login-theme-toggle"
          className="p-2 border border-enchanted-green/20 dark:border-light-ivory/20 rounded-full hover:border-elevated-gold dark:hover:border-elevated-gold transition-colors text-enchanted-green dark:text-light-ivory flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md mx-auto my-auto py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center p-2 bg-enchanted-green/5 dark:bg-light-ivory/20 dark:backdrop-blur-sm border border-enchanted-green/15 dark:border-elevated-gold/40 shadow-sm">
            <img src="/assets/images/IX_LOGOTIPO-01.svg" alt="IX" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs tracking-widest text-elevated-gold dark:text-rose-linen uppercase font-semibold mb-2">
            SISTEMA INTERNO DE GESTIÓN FINANCIERA
          </p>
          <h1 className="text-5xl md:text-6xl font-serif font-light text-enchanted-green dark:text-light-ivory tracking-tight">
            IX Dashboard
          </h1>
          <div className="w-12 h-[1px] bg-elevated-gold mx-auto mt-6"></div>
        </div>

        <div className="bg-[#FAF6F2] dark:bg-[#0E1A16] border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-8 shadow-xl relative overflow-hidden">
          {/* Decorative subtle border line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-cranberry/10 border border-cranberry/20 text-cranberry dark:text-rose-linen text-xs rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-2">
                Correo Electrónico
              </label>
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@ix.mx"
                className="w-full px-4 py-3 bg-light-ivory/40 dark:bg-[#051A14]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded-md text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-light-ivory/40 dark:bg-[#051A14]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded-md text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-enchanted-green/50 dark:text-light-ivory/50 hover:text-elevated-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full mt-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-all font-medium py-3 px-4 rounded-md flex items-center justify-center space-x-2 border border-transparent shadow-sm text-sm"
            >
              <span className="tracking-wide">Ingresar al Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-center text-[11px] text-rocky-gray">
            <span className="flex items-center space-x-1 justify-center">
              <ShieldCheck size={12} className="text-elevated-gold" />
              <span>Ambiente encriptado</span>
            </span>
          </div>
        </div>
      </div>


    </div>
  );
}
