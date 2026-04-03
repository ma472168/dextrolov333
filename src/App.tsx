/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram } from 'lucide-react';
import { FaGithub, FaSoundcloud } from 'react-icons/fa';

const countdownFontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function App() {
  const [showSecondTitle, setShowSecondTitle] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date('May 14, 2026 00:00:00').getTime();
    let animationFrameId = 0;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        return;
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          milliseconds: Math.floor(distance % 1000),
        });
      }

      animationFrameId = requestAnimationFrame(updateCountdown);
    };

    animationFrameId = requestAnimationFrame(updateCountdown);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const switchTimer = setTimeout(() => {
      setShowSecondTitle(true);
    }, 30000);

    return () => clearTimeout(switchTimer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  const formatMilliseconds = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 font-sans selection:bg-white selection:text-black bg-black text-white overflow-hidden">
      {/* Header with Title */}
      <header className="w-full flex justify-center pt-6 md:pt-16 px-2">
        <AnimatePresence mode="wait">
          <motion.h1
            key={showSecondTitle ? 'second-title' : 'first-title'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className={showSecondTitle
              ? 'text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light tracking-[0.2em] uppercase text-center leading-tight'
              : 'text-4xl sm:text-5xl md:text-8xl lg:text-[9rem] font-light tracking-[0.12em] sm:tracking-[0.16em] uppercase text-center leading-none break-words'
            }
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            {showSecondTitle ? 'lets go givenchy 2013' : 'dextrolov333'}
          </motion.h1>
        </AnimatePresence>
      </header>

      {/* Main Countdown - Horizontal and Clean */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-2 py-8 md:py-0">
        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:justify-center sm:items-center sm:gap-8 md:gap-16 w-full max-w-5xl">
          <TimeUnit value={formatNumber(timeLeft.days)} label="DAYS" />
          <TimeUnit value={formatNumber(timeLeft.hours)} label="HOURS" />
          <TimeUnit value={formatNumber(timeLeft.minutes)} label="MINUTES" />
          <TimeUnit value={formatNumber(timeLeft.seconds)} label="SECONDS" />
          <MillisecondsUnit value={formatMilliseconds(timeLeft.milliseconds)} label="MILLISECONDS" />
        </div>
      </main>

      {/* Footer & Socials */}
      <footer className="w-full flex flex-col items-center gap-8 pb-8 md:pb-10 px-2">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-12">
          <SocialLink href="https://www.instagram.com/dextrolov333/" icon={<Instagram size={24} />} label="Instagram" />
          <SocialLink href="https://www.instagram.com/xenredda/" icon={<Instagram size={24} />} label="Instagram" />
          <SocialLink href="https://www.soundcloud.com/breckislove/" icon={<FaSoundcloud size={24} />} label="SoundCloud" />
          <SocialLink href='https://github.com/ma472168' icon={<FaGithub size={24} />} label="GitHub" />
        </div>

        <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-30 text-center font-medium">
          hosted by xenredda & breck
        </div>
      </footer>
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-0">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-6xl sm:text-7xl md:text-9xl font-black font-mono tracking-tight leading-none"
          style={{ fontFamily: countdownFontFamily }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="mt-2 md:mt-4 text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] opacity-40 font-bold uppercase text-center">
        {label}
      </span>
    </div>
  );
}

function MillisecondsUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-0">
      <motion.span
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight leading-none"
        style={{ fontFamily: countdownFontFamily }}
      >
        {value}
      </motion.span>
      <span
        className="mt-2 md:mt-4 text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] opacity-40 font-bold uppercase text-center"
        style={{ fontFamily: countdownFontFamily }}
      >
        {label}
      </span>
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, opacity: 1 }}
      className="opacity-40 transition-opacity duration-300"
      aria-label={label}
    >
      {icon}
    </motion.a>
  );
}
