'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Users, Trophy, Zap } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div 
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <Image 
                  src="/logo.png" 
                  alt="Ludo Turco" 
                  width={384}
                  height={384}
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-200 mb-8"
            >
              Klasik Oyun, Modern Deneyim
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12"
            >
              Türkiye&#39;nin en sevilen Ludo oyunu! Arkadaşlarınla veya dünyanın dört bir yanından oyuncularla 
              çevrimiçi oyna, turnuvalara katıl, seviye atla ve ödüller kazan. 
              En güzel Ludo deneyimi seni bekliyor.
            </motion.p>
            

          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
          >
            <motion.a 
              href="#"
              className="group bg-black text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-gray-500/25 transition-all duration-300 flex items-center backdrop-blur-sm border border-gray-600 hover:border-gray-500"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="mr-4">
                <Image src="/apple-white-svgrepo-com.svg" alt="Apple" width={32} height={32} className="w-8 h-8" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-300">Download on the</div>
                <div className="text-xl font-semibold">App Store</div>
              </div>
            </motion.a>
            <motion.a 
              href="#"
              className="group bg-black text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300 flex items-center backdrop-blur-sm border border-gray-600 hover:border-gray-500"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="mr-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M4.5 3C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3h-15z"/>
                  <path fill="#34A853" d="M12 7.5l-5.5 5.5 5.5 5.5V7.5z"/>
                  <path fill="#FBBC05" d="M6.5 13l-2 2V8l2 2.5z"/>
                  <path fill="#EA4335" d="M12 7.5l5.5 5.5L12 18V7.5z"/>
                  <path fill="#FFFFFF" d="M17.5 13l2-2v5l-2-2.5z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-300">Get it on</div>
                <div className="text-xl font-semibold">Google Play</div>
              </div>
            </motion.a>
          </motion.div>

          {/* Game Modes Section */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mb-20"
          >
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="text-3xl font-bold text-gray-100 mb-12 text-center"
            >
              Oyun Modları
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-500/25">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-100 mb-3">Yapay Zeka Modu</h4>
                <p className="text-gray-400 text-base leading-relaxed">
                  Bilgisayara karşı oyna, stratejini geliştir ve becerilerini keskinleştir.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-green-500/50 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-green-500/25">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-100 mb-3">Online Mod</h4>
                <p className="text-gray-400 text-base leading-relaxed">
                  Gerçek oyuncularla çevrimiçi oyna, sohbet et ve yeni arkadaşlıklar kur.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-purple-500/25">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-100 mb-3">Serbest Mod</h4>
                <p className="text-gray-400 text-base leading-relaxed">
                  Kendi kurallarını belirle, özel oyunlar oluştur ve eğlenceni özelleştir.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}