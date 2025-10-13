"use client";
import { motion } from "framer-motion";
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-100 mb-8">
              Hemen İndir, Oyuna Başla!
            </h1>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Türkiye'nin en sevilen Ludo oyunu artık cebinde! Ücretsiz indir, arkadaşlarınla oyna, turnuvalara katıl ve ödüller kazan.
            </p>
            
            {/* App Store Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <motion.a 
                href="https://apps.apple.com/TR/app/ludo-turco/id1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-black text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-gray-500/25 transition-all duration-300 flex items-center backdrop-blur-sm border border-gray-600 hover:border-gray-500"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
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
                href="https://play.google.com/store/apps/details?id=com.ludoturco.android"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-black text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300 flex items-center backdrop-blur-sm border border-gray-600 hover:border-gray-500"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
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

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-100 mb-6">
              Neden Ludo Turco?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Türkiye'nin en gelişmiş Ludo oyunu ile tanış. Binlerce oyuncu, eşsiz özellikler ve sürekli güncellemeler!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Ücretsiz İndir",
                description: "Tamamen ücretsiz! Gizli ücret, abonelik veya reklam yok.",
                icon: "🎲"
              },
              {
                title: "Çevrimiçi Multiplayer",
                description: "Türkiye'nin dört bir yanından oyuncularla gerçek zamanlı oyna.",
                icon: "🌟"
              },
              {
                title: "Yapay Zeka Modu",
                description: "İstersen bilgisayara karşı oyna, stratejini geliştir.",
                icon: "🤖"
              },
              {
                title: "Güvenli ve Adil",
                description: "Gelişmiş güvenlik sistemleri ile adil oyun garantisi.",
                icon: "🔒"
              },
              {
                title: "Sohbet Özelliği",
                description: "Oyun sırasında diğer oyuncularla sohbet et.",
                icon: "💬"
              },
              {
                title: "Turnuvalar",
                description: "Haftalık turnuvalara katıl, ödüller kazan.",
                icon: "🏆"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-100 mb-8">
              Sistem Gereksinimleri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
                  <span className="mr-3">🍎</span> iOS
                </h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• iOS 12.0 veya üzeri</li>
                  <li>• iPhone 6s veya üzeri</li>
                  <li>• iPad Air veya üzeri</li>
                  <li>• 150 MB boş alan</li>
                </ul>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold text-gray-100 mb-4 flex items-center">
                  <span className="mr-3">🤖</span> Android
                </h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• Android 6.0 (API 23) veya üzeri</li>
                  <li>• 2 GB RAM veya üzeri</li>
                  <li>• 1.5 GHz işlemci veya üzeri</li>
                  <li>• 150 MB boş alan</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Hala Düşünüyor musun?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              100.000'den fazla oyuncu Ludo Turco'yu tercih ediyor. Sende aramıza katıl, Türkiye'nin en büyük Ludo topluluğunun bir parçası ol!
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/"
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Ana Sayfaya Dön
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}