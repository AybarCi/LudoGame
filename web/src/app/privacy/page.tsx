import { Metadata } from "next";
import { Shield, Eye, Lock, Users, Globe, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Gizlilik Politikası - Ludo Turco",
  description: "Ludo Turco'da gizliliğinizi nasıl koruduğumuzu ve verilerinizi nasıl işlediğimizi öğrenin",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 text-orange-400 mr-4" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Gizlilik Politikası
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Gizliliğiniz bizim için önceliklidir. Kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
              <p className="text-gray-300">
                Son güncelleme: <span className="text-white font-semibold">{new Date().toLocaleDateString("tr-TR", { month: "long", day: "numeric", year: "numeric" })}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Data Collection Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-orange-400/50 transition-all duration-300">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
              <Eye className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Ne Topluyoruz</h3>
            <p className="text-gray-300 mb-4">Size en iyi oyun deneyimini sunmak için yalnızca temel bilgileri topluyoruz.</p>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Kullanıcı adı (rumuz)</li>
              <li>• Telefon numarası</li>
              <li>• Oyun istatistikleri</li>
              <li>• Cihaz bilgileri</li>
              <li>• Oyun tercihleri</li>
            </ul>
          </div>

          {/* Data Usage Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Nasıl Kullanıyoruz</h3>
            <p className="text-gray-300 mb-4">Verileriniz, oyun deneyiminizi iyileştirmemize ve daha iyi hizmetler sunmamıza yardımcı olur.</p>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Eşleştirme ve oyun oynama</li>
              <li>• Lider tabloları ve istatistikler</li>
              <li>• Müşteri desteği</li>
              <li>• Oyun iyileştirmeleri</li>
            </ul>
          </div>

          {/* Data Protection Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-300">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Nasıl Koruyoruz</h3>
            <p className="text-gray-300 mb-4">Verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri uyguluyoruz.</p>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Şifreleme (hareket halinde ve saklanırken)</li>
              <li>• Düzenli güvenlik denetimleri</li>
              <li>• Sınırlı erişim kontrolleri</li>
              <li>• Güvenli veri merkezleri</li>
            </ul>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Globe className="w-8 h-8 mr-3 text-blue-400" />
              Topladığımız Bilgiler
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-orange-300 mb-3">Kişisel Bilgiler</h4>
                <ul className="text-gray-300 space-y-2">
                  <li>• Kullanıcı adı (rumuz)</li>
                  <li>• Telefon numarası (hesap doğrulaması için)</li>
                  <li>• Profil resmi (isteğe bağlı)</li>
                  <li>• Dil tercihleri</li>
                </ul>
                <p className="text-gray-400 text-sm mt-3">Not: E-posta adresi toplamıyoruz. Sadece telefon numarası ve rumuz ile kayıt olunur.</p>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-orange-300 mb-3">Oyun Verileri</h4>
                <ul className="text-gray-300 space-y-2">
                  <li>• Oyun istatistikleri ve puanlar</li>
                  <li>• Maç geçmişi ve tekrarlar</li>
                  <li>• Başarım ilerlemesi</li>
                  <li>• Oyum içi satın alımlar (uygulanabilirse)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Users className="w-8 h-8 mr-3 text-green-400" />
              Bilgilerinizi Nasıl Kullanıyoruz
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Hizmetlerimizi Sağlamak İçin</h4>
                  <p className="text-gray-300">Bilgilerinizi hesabınızı oluşturmak ve yönetmek, oyun oynamayı kolaylaştırmak ve lider tablolarını korumak için kullanıyoruz.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Oyunumuzu Geliştirmek İçin</h4>
                  <p className="text-gray-300">Oyun verilerini kullanıcı davranışını anlamak ve oyun mekaniklerini ve özelliklerini iyileştirmek için analiz ediyoruz.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Sizinle İletişim Kurmak İçin</h4>
                  <p className="text-gray-300">Size yeni özellikler hakkında güncellemeler gönderebilir, önemli duyurular yapabilir veya sorularınızı yanıtlayabiliriz.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Lock className="w-8 h-8 mr-3 text-yellow-400" />
              Veri Güvenliği
            </h2>
            <p className="text-gray-300 mb-6">
              Kişisel bilgilerinizin güvenliğini ciddiye alıyoruz. Kişisel verilerinizi yetkisiz erişime, değişikliğe, ifşaya veya yok edilmeye karşı korumak için uygun teknik ve organizasyonel önlemler uyguluyoruz.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-orange-300 mb-3">Teknik Önlemler</h4>
                <ul className="text-gray-400 space-y-2 text-sm">
                  <li>• SSL/TLS şifrelemesi</li>
                  <li>• Güvenli sunucu altyapısı</li>
                  <li>• Düzenli güvenlik güncellemeleri</li>
                  <li>• Veri yedekleme ve kurtarma</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-orange-300 mb-3">Organizasyonel Önlemler</h4>
                <ul className="text-gray-400 space-y-2 text-sm">
                  <li>• Sınırlı erişim kontrolleri</li>
                  <li>• Veri koruması konusunda personel eğitimi</li>
                  <li>• Düzenli güvenlik denetimleri</li>
                  <li>• Olay müdahale prosedürleri</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <AlertTriangle className="w-8 h-8 mr-3 text-red-400" />
              Çocukların Gizliliği
            </h2>
            <p className="text-gray-300 mb-4">
              Hizmetlerimiz 13 yaşın altındaki çocuklara yönelik değildir. 13 yaşın altındaki çocuklardan bilinçli olarak kişisel bilgi toplamıyoruz. Ebeveyn veya veliyseniz ve çocuğunuzun bize kişisel bilgi sağladığını düşünüyorsanız, lütfen bizimle hemen iletişime geçin.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <p className="text-red-300">
                <strong>Önemli:</strong> 13 yaşın altındaki bir çocuktan ebeveyn onayı doğrulanmadan kişisel bilgi topladığımızı fark edersek, bu bilgileri sunucularımızdan kaldırmak için adımlar atacağız.
              </p>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-3xl font-bold text-white mb-6">Bu Politikadaki Değişiklikler</h2>
            <p className="text-gray-300 mb-4">
              Gizlilik Politikamızı zaman zaman güncelleyebiliriz. Herhangi bir değişiklik hakkında sizi bilgilendirmek için yeni politikayı bu sayfada yayınlayacağız ve &quot;Son güncelleme&quot; tarihini güncelleyeceğiz. Herhangi bir değişiklik için bu Gizlilik Politikasını periyodik olarak gözden geçirmenizi teşvik ediyoruz.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <p className="text-blue-300">
                Bu politikadaki değişiklikler, yayınlandıklarında yürürlüğe girer. Hizmetlerimizi herhangi bir değişiklikten sonraki kullanımınız, güncellenmiş politikayı kabul ettiğiniz anlamına gelir.
              </p>
            </div>
          </section>

          <section className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6">Bizimle İletişime Geçin</h2>
            <p className="text-gray-300 mb-6">
              Bu Gizlilik Politikası veya veri uygulamalarımızla ilgili herhangi bir sorunuz, endişeniz veya talebiniz varsa, lütfen bizimle iletişime geçmekten çekinmeyin.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-orange-300 mb-3">E-posta Desteği</h4>
                <p className="text-gray-300 mb-2">Genel sorular için:</p>
                <a href="mailto:privacy@ludoturco.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                  privacy@ludoturco.com
                </a>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-orange-300 mb-3">Veri Koruma Görevlisi</h4>
                <p className="text-gray-300 mb-2">Veri koruması endişeleri için:</p>
                <a href="mailto:dpo@ludoturco.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                  dpo@ludoturco.com
                </a>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Gizlilikle ilgili sorulara genellikle 24-48 saat içinde yanıt veriyoruz.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}