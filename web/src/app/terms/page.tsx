import { Metadata } from "next";
import { Shield, Users, CreditCard, AlertTriangle, Copyright, AlertCircle, Gavel, RefreshCw, Mail, FileText, CheckCircle, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Kullanım Şartları - Ludo Turco",
  description: "Ludo Turco mobil uygulamasını kullanmak için kullanım şartları ve koşullar",
};

export default function TermsOfService() {
  const sections = [
    {
      icon: <Shield className="w-8 h-8 text-blue-400" />,
      title: "Şartları Kabul",
      content: "Ludo Turco mobil uygulamasına erişerek ve kullanarak, bu Kullanım Şartlarına bağlı olmayı kabul edersiniz. Bu şartları kabul etmiyorsanız, lütfen hizmetlerimizi kullanmayın."
    },
    {
      icon: <Users className="w-8 h-8 text-green-400" />,
      title: "Hizmet Kullanımı",
      content: "Hizmetlerimizi yalnızca yasal amaçlarla ve bu Şartlara uygun olarak kullanmayı kabul edersiniz. Hesap bilgilerinizin gizliliğini korumaktan siz sorumlusunuz.",
      subitems: [
        "Hile yapmak, hatalardan yararlanmak veya yetkisiz üçüncü taraf yazılımları kullanmak",
        "Diğer oyuncuları taciz etmek, tehdit etmek veya kötü muamelede bulunmak",
        "Başka kullanıcıları veya kuruluşları taklit etmek",
        "Dolandırıcılık faaliyetlerinde bulunmak",
        "Geçerli yasaları veya yönetmelikleri ihlal etmek"
      ]
    },
    {
      icon: <CreditCard className="w-8 h-8 text-yellow-400" />,
      title: "Uygulama İçi Satın Alımlar",
      content: "Uygulamamız sanal ürünler ve premium özellikler için uygulama içi satın alımlar sunabilir. Tüm satın alımlar sonradan ve yasalar gerektirmedikçe iade edilemez. Fiyatlar önceden haber verilmeksizin değiştirilebilir."
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
      title: "Hesap Askıya Alma",
      content: "Bu Kullanım Şartlarının ihlali veya topluluğumuzu ve hizmetlerimizi korumak için gerekli gördüğümüz başka bir nedenle, hesabınızı herhangi bir zamanda askıya alma veya sonlandırma hakkınımız saklıdır."
    },
    {
      icon: <Copyright className="w-8 h-8 text-purple-400" />,
      title: "Fikri Mülkiyet",
      content: "Ludo Turco uygulamasının tüm içerik, özellik ve işlevleri bize aittir ve uluslararası telif hakkı, ticari marka ve diğer fikri mülkiyet yasalarıyla korunmaktadır."
    },
    {
      icon: <AlertCircle className="w-8 h-8 text-gray-400" />,
      title: "Sorumluluk Reddi",
      content: "Hizmetlerimiz 'olduğu gibi', açık veya zımni hiçbir garanti olmaksızın sunulmaktadır. Hizmetlerimizin kesintisiz, hatasız veya virüs veya diğer zararlı bileşenlerden arınmış olacağını garanti etmiyoruz."
    },
    {
      icon: <Gavel className="w-8 h-8 text-indigo-400" />,
      title: "Yürürlükteki Hukuk",
      content: "Bu Kullanım Şartları, faaliyet gösterdiğimiz yargı alanının yasalarına göre yönetilecek ve yorumlanacaktır."
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-orange-400" />,
      title: "Şartlarda Değişiklik",
      content: "Bu Kullanım Şartlarını herhangi bir zamanda değiştirebiliriz. Önemli değişiklikleri uygulamamız veya diğer makul araçlar yoluyla size bildireceğiz. Bu tür değişikliklerden sonra hizmetlerimizi kullanmaya devam etmeniz, güncellenen şartları kabul ettiğiniz anlamına gelir."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Bölümü */}
      <div className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <FileText className="w-16 h-16 text-blue-400 mr-4" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Kullanım Şartları
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
            Hizmetlerimizi kullanmadan önce lütfen bu şartları dikkatlice okuyun
          </p>
          <p className="text-gray-400">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Hızlı Özet */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
            <CheckCircle className="w-8 h-8 mr-3 text-green-400" />
            Hızlı Özet
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">Dürüst Oyun</h4>
                <p className="text-gray-300 text-sm">Dürüst oyna, hile yapma, diğer oyunculara saygı göster</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">Hesap Güvenliği</h4>
                <p className="text-gray-300 text-sm">Hesabınızı güvende ve gizli tutun</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">Satın Alımlar</h4>
                <p className="text-gray-300 text-sm">Uygulama içi satın alımlar kesindir ve iade edilmez</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">Toppluluk</h4>
                <p className="text-gray-300 text-sm">Pozitif oyun ortamını korumamıza yardım edin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Şartlar Bölümleri */}
        <div className="space-y-8 mb-16">
          {sections.map((section, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-6">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{section.content}</p>
              {section.subitems && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <p className="text-white font-semibold mb-4">Yasaklanan faaliyetler arasında şunlar yer alır (ancak bunlarla sınırlı değildir):</p>
                  <ul className="space-y-3">
                    {section.subitems.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* İletişim Bölümü */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
          <div className="text-center">
            <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Şartlarımız Hakkında Sorularınız mı Var?</h2>
            <p className="text-gray-300 text-lg mb-6">
              Bu Kullanım Şartları hakkında herhangi bir sorunuz varsa, lütfen çekinmeden bizimle iletişime geçin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:legal@ludoturco.com"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                <Mail className="w-5 h-5 mr-2" />
                Hukuk Ekibiyle İletişime Geçin
              </a>
              <a 
                href="/support"
                className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold border border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Genel Destek
              </a>
            </div>
            <div className="mt-8 text-gray-400">
              <p><strong>Hukuk Departmanı:</strong> Ludo Turco Hukuk Ekibi</p>
              <p><strong>E-posta:</strong> legal@ludoturco.com</p>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Hizmetlerimizi kullanmaya devam ederek, bu Kullanım Şartlarını okuduğunuzu, anladığınızı ve bu şartlara bağlı olmayı kabul ettiğinizi kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
}