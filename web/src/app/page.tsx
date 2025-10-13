"use client"

import Hero from "@/components/Hero";
import { Star, Zap, Trophy, Users, MessageCircle, Gem, Battery, Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="relative">
      <Hero />
      
      {/* Features Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-100 mb-6">
              Seviye Sistemi ve Ödüller
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Oyun oynadıkça seviye atla, ödüller kazan ve liderlik sıralamasında yüksel!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-yellow-500/50 transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-yellow-500/25">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-4">Seviye Sistemi</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                1'den 100'e kadar seviye sistemimizle her oyununda tecrübe puanı kazan.
              </p>
              <div className="bg-gray-700/50 rounded-full h-3 mb-3">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full w-3/4"></div>
              </div>
              <p className="text-sm text-gray-500">Seviye 75 - 25,420 XP</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-500/25">
                <Gem className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-4">Elmas Sistemi</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                Her gün giriş yap, görevleri tamamla ve elmas kazan.
              </p>
              <div className="flex items-center justify-center mb-3">
                <Gem className="w-6 h-6 text-blue-400 mr-3" />
                <span className="text-gray-100 font-bold text-2xl">2,450</span>
              </div>
              <p className="text-sm text-gray-500">Günlük bonus: +50 elmas</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-green-500/50 transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-green-500/25">
                <Battery className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-4">Enerji Sistemi</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                Enerjinle sınırlı oyna, zamanla yenilen veya elmasla satın al.
              </p>
              <div className="flex items-center justify-center mb-3">
                <Battery className="w-6 h-6 text-green-400 mr-3" />
                <span className="text-gray-100 font-bold text-2xl">8/10</span>
              </div>
              <p className="text-sm text-gray-500">Yenilenme: 15 dk</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-purple-500/25">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-4">Piyon Koleksiyonu</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                Farklı piyon tasarımları satın al ve oyun stilini kişiselleştir.
              </p>
              <div className="flex items-center justify-center mb-3 space-x-2">
                <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-500">+25 farklı piyon</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* App Screenshots Section - Apple Style */}
      <section className="py-32 bg-black relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-7xl font-thin text-white mb-6 tracking-tight">
              Deneyim
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
              Ludo Turco'nun eşsiz oyun deneyimini keşfet
            </p>
          </motion.div>

          {/* Main showcase - Premium Show Design */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mb-24 relative"
          >
            <div className="max-w-6xl mx-auto">
              {/* Floating elements background */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-br from-pink-500/20 to-blue-600/20 rounded-full blur-2xl"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-br from-yellow-500/20 to-red-600/20 rounded-full blur-2xl"></div>
                </motion.div>
              </div>
              
              {/* Main content */}
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="mb-12"
                >
                  <div className="inline-flex items-center space-x-4 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-4xl font-bold text-white mb-2">Premium Deneyim</h3>
                      <p className="text-xl text-gray-400">Ludo Turco ile tanış</p>
                    </div>
                  </div>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Çok Oyunculu</h4>
                    <p className="text-gray-400 text-sm">Gerçek oyuncularla yarış</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      <Gem className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Elmas Sistemi</h4>
                    <p className="text-gray-400 text-sm">Ödüller kazan</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-yellow-500/50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Turnuvalar</h4>
                    <p className="text-gray-400 text-sm">Büyük ödüller kazan</p>
                  </motion.div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                    "Her oyun yeni bir hikaye, her hamle yeni bir fırsat"
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-gray-400">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-600"></div>
                    <span className="text-sm">Ludo Turco Ekibi</span>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-600"></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Screenshot Gallery - Apple Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Online Mode */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
              className="group relative overflow-hidden rounded-[2rem] bg-gray-900/50 backdrop-blur-sm border border-white/10"
            >
              <div className="aspect-[9/16] relative">
                <img 
                  src="/screenshots/onlinemodgameboard.png" 
                  alt="Çevrimiçi Mod" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-50 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute bottom-6 left-6 right-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                  <h3 className="text-xl font-light text-white mb-2">Çevrimiçi Mod</h3>
                  <p className="text-sm text-gray-300 font-light">Gerçek oyuncularla yarış</p>
                </div>
              </div>
            </motion.div>

            {/* Pawn Store */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              className="group relative overflow-hidden rounded-[2rem] bg-gray-900/50 backdrop-blur-sm border border-white/10"
            >
              <div className="aspect-[9/16] relative">
                <img 
                  src="/screenshots/piyonmagazasiscreen.png" 
                  alt="Piyon Mağazası" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-50 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute bottom-6 left-6 right-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                  <h3 className="text-xl font-light text-white mb-2">Piyon Mağazası</h3>
                  <p className="text-sm text-gray-300 font-light">Kişiselleştirme seçenekleri</p>
                </div>
              </div>
            </motion.div>

            {/* AI Mode */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true, amount: 0.3 }}
              className="group relative overflow-hidden rounded-[2rem] bg-gray-900/50 backdrop-blur-sm border border-white/10"
            >
              <div className="aspect-[9/16] relative">
                <img 
                  src="/screenshots/yapayzekamodboard.png" 
                  alt="Yapay Zeka Modu" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-50 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute bottom-6 left-6 right-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                  <h3 className="text-xl font-light text-white mb-2">Yapay Zeka</h3>
                  <p className="text-sm text-gray-300 font-light">Stratejini geliştir</p>
                </div>
              </div>
            </motion.div>

            {/* Home Screen */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, amount: 0.3 }}
              className="group relative overflow-hidden rounded-[2rem] bg-gray-900/50 backdrop-blur-sm border border-white/10"
            >
              <div className="aspect-[9/16] relative">
                <img 
                  src="/screenshots/homescreen.png" 
                  alt="Ana Ekran" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-50 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute bottom-6 left-6 right-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                  <h3 className="text-xl font-light text-white mb-2">Ana Ekran</h3>
                  <p className="text-sm text-gray-300 font-light">Tüm modlara erişim</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chat Feature Section */}
      <section className="py-32 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-100 mb-6">
              Çevrimiçi Sohbet Özelliği
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Oyun sırasında diğer oyuncularla sohbet et, stratejilerini paylaş ve yeni arkadaşlıklar kur!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex items-start space-x-6"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-3">Gerçek Zamanlı Sohbet</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">Oyun sırasında anlık mesajlaşma ile iletişim kur.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex items-start space-x-6"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-3">Emoji ve İfadeler</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">Eğlenceli emojiler ve özel ifadelerle duygularını ifade et.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex items-start space-x-6"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/25">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-3">Güvenli Ortam</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">Gelişmiş filtreleme sistemi ile güvenli ve saygılı bir ortam.</p>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700"
            >
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <span className="text-gray-100 font-semibold text-lg">Oyuncu 1</span>
                </div>
                <div className="bg-gray-700/50 rounded-2xl p-4 ml-14">
                  <p className="text-gray-100 text-base">Merhaba! Bol şans 😊</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <span className="text-gray-100 font-semibold text-lg">Sen</span>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 ml-14">
                  <p className="text-white text-base">Teşekkürler! Sana da bol şans 🎲</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <span className="text-gray-100 font-semibold text-lg">Oyuncu 2</span>
                </div>
                <div className="bg-gray-700/50 rounded-2xl p-4 ml-14">
                  <p className="text-gray-100 text-base">Harika hamle! 👏</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-5xl md:text-6xl font-bold text-gray-100 mb-8"
            >
              Hemen Oyuna Başla!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-xl text-gray-400 mb-12 leading-relaxed"
            >
              Türkiye'nin en büyük Ludo topluluğuna katıl, arkadaşlarınla oyna ve ödüller kazan!
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <motion.a 
                href="#"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-black text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-gray-500/25 transition-all duration-300 flex items-center backdrop-blur-sm border border-gray-600 hover:border-gray-500"
              >
                <div className="mr-4">
                  <img src="/apple-white-svgrepo-com.svg" alt="Apple" className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-300">Download on the</div>
                  <div className="text-xl font-semibold">App Store</div>
                </div>
              </motion.a>
              <motion.a 
                href="#"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-black text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300 flex items-center backdrop-blur-sm border border-gray-600 hover:border-gray-500"
              >
                <div className="mr-4">
                  <img src="/google-play-svgrepo-com.svg" alt="Google Play" className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-300">Get it on</div>
                  <div className="text-xl font-semibold">Google Play</div>
                </div>
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
