import { Metadata } from "next";
import { Mail, MessageCircle, Clock, HelpCircle, Phone, Send, Star, Users, Zap, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: "Destek - Ludo Turco",
  description: "Ludo Turco için yardım alın. Destekle iletişime geçin, sık sorulan soruların cevaplarını bulun ve yardım alın.",
};

export default function SupportPage() {
  const faqs = [
    {
      question: "Nasıl hesap oluşturabilirim?",
      answer: "Uygulamayı indirin, 'Kayıt Ol' butonuna tıklayın ve kayıt sürecini takip edin. Telefon numaranızla kayıt olabilirsiniz."
    },
    {
      question: "Çevrimdışı oynayabilir miyim?",
      answer: "Evet! Ludo Turco hem çevrimiçi çok oyunculu hem de çevrimdışı modlar sunar. İnternet bağlantınız olmadığında AI rakiplere karşı oynayabilirsiniz."
    },
    {
      question: "Bir hatayı nasıl bildirebilirim?",
      answer: "Uygulama içi geri bildirim özelliğini kullanın veya sorun hakkında detaylarla birlikte support@ludoturco.com adresine e-posta gönderin, mümkünse ekran görüntüleri ekleyin."
    },
    {
      question: "Oyun adil ve rastgele mi?",
      answer: "Kesinlikle! Adil oyun için sertifikalı rastgele sayı üreteçleri kullanıyoruz. Tüm zar atışları tamamen rastgeledir ve manipüle edilemez."
    },
    {
      question: "Arkadaşlarımla oynayabilir miyim?",
      answer: "Evet! Özel odalar oluşturun ve arkadaşlarınızı oda kodlarıyla davet edin veya birlikte oynamak için sosyal medya üzerinden bağlanın."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Bölümü */}
      <div className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center mb-6">
              <HelpCircle className="w-16 h-16 text-blue-400 mr-4" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Size Nasıl Yardımcı Olabiliriz?
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Sorularınızın cevaplarını alın, sorunları bildirin veya sadece merhaba deyin. 7/24 yardım için buradayız.
            </p>
          </div>
        </div>
      </div>

      {/* İletişim Yöntemleri */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* E-posta Desteği */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">E-posta Desteği</h3>
            <p className="text-gray-300 mb-6">Bize e-posta gönderin ve 24 saat içinde size geri dönelim.</p>
            <a 
              href="mailto:support@ludoturco.com" 
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <Send className="w-5 h-5 mr-2" />
              support@ludoturco.com
            </a>
          </div>

          {/* Detaylı Destek */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Detaylı Destek</h3>
            <p className="text-gray-300 mb-6">Karmaşık sorunlar için detaylı e-posta desteği alın.</p>
            <a 
              href="mailto:detailed@ludoturco.com" 
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              <Mail className="w-5 h-5 mr-2" />
              detailed@ludoturco.com
            </a>
            <p className="text-sm text-gray-400 mt-3">48 saat içinde yanıt</p>
          </div>
        </div>

        {/* Yanıt Süreleri */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Yanıt Süreleri</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">E-posta Desteği</h4>
              <p className="text-2xl font-bold text-green-400">24 saat</p>
              <p className="text-gray-400 text-sm">Genellikle daha hızlı</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Detaylı Destek</h4>
              <p className="text-2xl font-bold text-blue-400">48 saat</p>
              <p className="text-gray-400 text-sm">Karmaşık sorunlar için</p>
            </div>
          </div>
        </div>

        {/* SSS Bölümü */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-12 text-center flex items-center justify-center">
            <HelpCircle className="w-8 h-8 mr-3 text-blue-400" />
            Sıkça Sorulan Sorular
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}