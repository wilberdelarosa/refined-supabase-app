import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import logo from '@/assets/barbaro-logo.png';

const SPLASH_KEY = 'barbaro-splash-shown';

export function LoadingSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if splash has been shown before
    const hasSeenSplash = sessionStorage.getItem(SPLASH_KEY);
    
    if (!hasSeenSplash) {
      setShow(true);
      // Mark as shown
      sessionStorage.setItem(SPLASH_KEY, 'true');
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShow(false);
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted overflow-hidden"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: 0,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo with scale and glow animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 1,
            }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(var(--primary), 0.3)",
                  "0 0 60px rgba(var(--primary), 0.6)",
                  "0 0 20px rgba(var(--primary), 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="rounded-3xl overflow-hidden"
            >
              <img 
                src={logo} 
                alt="Barbaro Nutrition" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </motion.div>
          </motion.div>

          {/* Welcome text with stagger */}
          <div className="flex flex-col items-center gap-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-foreground"
            >
              Barbaro Nutrition
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground font-medium"
            >
              Potencia tu entrenamiento
            </motion.p>

            {/* Loading bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
              className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full overflow-hidden"
            >
              <motion.div
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
              />
            </motion.div>
          </div>
        </div>

        {/* Subtle gradient overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent"
        />
      </motion.div>
    </AnimatePresence>
  );
}
