
// My Compass App - Career Guidance Platform
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import CareerChart from './components/CareerChart';
import PdfReportTemplate from './components/PdfReportTemplate';
import RiasecIcon from './components/RiasecIcon';
import { QUESTIONS, SESSIONS, RIASEC_INFO } from './constants';
import { RIASECScores, ChatMessage, RIASECKey, Session } from './types';
import { getCareerGuidance, getInitialAnalysis } from './services/geminiService';
import { exportReportToPdf } from './utils/exportPdf';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<RIASECScores | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [reportGeneratedAt, setReportGeneratedAt] = useState<Date>(() => new Date());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pdfReportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ar-JO';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentInput(prev => prev + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const calculateResult = async () => {
    const newScores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    Object.entries(answers).forEach(([id, val]) => {
      const question = QUESTIONS.find(q => q.id === parseInt(id));
      if (question) {
        newScores[question.category] += val as number;
      }
    });
    setScores(newScores);
    setReportGeneratedAt(new Date());
    setQuizStarted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setIsChatLoading(true);
    const analysis = await getInitialAnalysis(newScores);
    setAiAnalysis(analysis);
    setIsChatLoading(false);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !scores) return;
    
    const userMsg: ChatMessage = { role: 'user', text: currentInput };
    setChatMessages(prev => [...prev, userMsg]);
    const messageToSend = currentInput;
    setCurrentInput('');
    setIsChatLoading(true);

    const botResponse = await getCareerGuidance(scores, messageToSend);
    setChatMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    setIsChatLoading(false);
  };

  const getSortedCategories = (scores: RIASECScores) => {
    return (Object.entries(scores) as [RIASECKey, number][])
      .sort(([, a], [, b]) => b - a);
  };

  const handleDownloadPdf = async () => {
    if (!pdfReportRef.current || isExportingPdf) return;
    setReportGeneratedAt(new Date());
    setIsExportingPdf(true);
    setPdfStatus('idle');
    try {
      await exportReportToPdf(pdfReportRef.current, studentName);
      setPdfStatus('success');
      setTimeout(() => setPdfStatus('idle'), 4500);
    } catch (error) {
      console.error('PDF export failed:', error);
      setPdfStatus('error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintReport = () => {
    setReportGeneratedAt(new Date());
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const formatAiText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const cleanLine = line.trim();
      if (!cleanLine) return <div key={i} className="h-3" />;
      
      if (cleanLine.startsWith('###')) {
        return <h3 key={i} className="text-xl sm:text-2xl font-black mt-8 mb-4 text-emerald-400 flex items-center gap-3 text-right">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
          {cleanLine.replace(/###/g, '')}
        </h3>;
      }
      
      if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
        return <h4 key={i} className="text-lg font-bold mt-4 mb-2 text-white text-right">{cleanLine.replace(/\*\*/g, '')}</h4>;
      }

      if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
        return (
          <div key={i} className="flex gap-3 mb-2 mr-2 text-right">
            <span className="text-emerald-500 mt-2 shrink-0">✦</span>
            <span className="text-slate-300 leading-relaxed">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }
      
      return <p key={i} className="text-slate-300 mb-3 text-base leading-relaxed text-right">{cleanLine}</p>;
    });
  };

  const renderHome = () => (
    <div className="space-y-12 sm:space-y-24 py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-8 sm:pt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black shadow-sm border border-emerald-100 animate-fade-in-up">
          رؤية التحديث الاقتصادي - الأردن 🇯🇴
        </div>
        <h2 className="text-4xl font-black text-slate-900 sm:text-7xl leading-[1.4] pb-2">
          اكتشف شغفك، <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 pt-2 pb-[0.35em] -mb-[0.15em] leading-[1.5] inline-block">ارسم مسارك المهني</span>
        </h2>
        <p className="text-emerald-600 font-black text-sm sm:text-lg animate-fade-in">مدرسة أحمد اللوزي الثانوية للبنين</p>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light px-4">
          نحول حيرتك إلى خطة عمل واضحة المعالم باستخدام خوارزميات الذكاء الاصطناعي ونظرية هولاند العالمية للميول المهنية.
        </p>
        <div className="pt-6 sm:pt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-4">
          <button 
            onClick={() => setActiveTab('quiz')}
            className="group relative bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-2xl sm:rounded-[2rem] font-black shadow-2xl shadow-emerald-200 transition-all overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              ابدأ المقياس الذكي
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          <button 
            onClick={() => setActiveTab('market')}
            className="bg-white border-2 border-slate-100 hover:border-emerald-200 text-slate-600 px-8 py-5 rounded-2xl sm:rounded-[2rem] font-black transition-all hover:bg-slate-50"
          >
            استكشف سوق العمل
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
        {[
          { title: "دقة علمية", desc: "أسئلة مصممة وفق معايير عالمية لقياس الميول المهنية الدقيقة.", icon: "🎯", color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "تحليل ذكي", desc: "خوارزميات متطورة تحلل نمط شخصيتك وتقترح تخصصات المستقبل.", icon: "🧠", color: "text-blue-500", bg: "bg-blue-50" },
          { title: "سوق العمل الأردني", desc: "ربط ميولك بالقطاعات الأكثر طلباً في المملكة ورؤية 2026.", icon: "🚀", color: "text-purple-500", bg: "bg-purple-50" }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
            <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center text-4xl mb-8 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
              {item.icon}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-4">{item.title}</h3>
            <p className="text-slate-500 text-base leading-relaxed font-light">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="max-w-7xl mx-auto space-y-12 sm:space-y-20 py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">سوق العمل الأردني 2026</h2>
        <p className="text-slate-500 text-lg sm:text-xl font-light leading-relaxed">
          تحولات كبرى تقودها التكنولوجيا والأتمتة في المملكة. نحن نساعدك على وضع قدمك في القطاع الصحيح للمستقبل.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "تقنية المعلومات", growth: "+14.2%", icon: "💻", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "الطاقة البديلة", growth: "+11.5%", icon: "☀️", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "الصناعات التقنية", growth: "+8.9%", icon: "⚙️", color: "text-orange-600", bg: "bg-orange-50" },
          { label: "السياحة النوعية", growth: "+16.8%", icon: "🏛️", color: "text-rose-600", bg: "bg-rose-50" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center transition-all hover:border-emerald-200">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-4`}>{stat.icon}</div>
            <div className={`text-2xl sm:text-3xl font-black mb-1 ${stat.color}`}>{stat.growth}</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">نمو سنوي متوقع</div>
            <div className="mt-4 text-sm sm:text-base text-slate-700 font-black">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Salaries Section */}
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-10">
        <div className="lg:col-span-1 bg-emerald-600 rounded-[2.5rem] p-8 sm:p-10 text-white flex flex-col justify-center items-center text-center shadow-xl shadow-emerald-200/40 border border-emerald-500">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-6 backdrop-blur-md">💵</div>
          <h3 className="text-xl font-bold mb-2">الحد الأدنى للأجور 2026</h3>
          <div className="text-5xl font-black mb-2">290</div>
          <div className="text-emerald-100 font-bold tracking-widest uppercase text-xs">دينار أردني شهرياً</div>
          <p className="mt-6 text-emerald-50 text-sm font-light leading-relaxed">
            وفقاً لآخر التحديثات، يمثل هذا الرقم الحد الأدنى القانوني للرواتب في كافة القطاعات بالمملكة لعام 2026.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">متوسط الرواتب التقريبي 2026</h3>
              <p className="text-slate-400 text-sm font-light">لخريجي البكالوريوس الجدد (أول سنة عمل)</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {[
              { label: "تكنولوجيا المعلومات والبرمجة", range: "500 - 850", color: "bg-blue-500" },
              { label: "التمريض والرعاية الصحية", range: "400 - 600", color: "bg-emerald-500" },
              { label: "الهندسة (الطاقة والاتصالات)", range: "450 - 700", color: "bg-purple-500" },
              { label: "الخدمات المالية والمحاسبة", range: "400 - 550", color: "bg-orange-500" },
              { label: "التعليم والتدريب", range: "320 - 480", color: "bg-rose-500" }
            ].map((sal, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${sal.color}`}></div>
                  <span className="font-bold text-slate-700">{sal.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900">{sal.range}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">دينار</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[11px] text-slate-400 font-light italic text-center">
            * الرواتب تعتمد بشكل كبير على المهارات العملية، حجم الشركة، والموقع الجغرافي.
          </p>
        </div>
      </div>

      {/* Unemployment Alert */}
      <div className="bg-rose-50 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-rose-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-rose-200/20 rounded-full blur-3xl -ml-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-3xl shadow-xl shadow-rose-200/50 flex items-center justify-center text-5xl">📊</div>
            <div className="mt-4 text-center">
              <span className="block text-3xl font-black text-rose-600">21.2%</span>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">معدل البطالة العام</span>
            </div>
          </div>
          <div className="space-y-6 flex-1 text-center lg:text-right">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-900 mb-2">تحدي التخصصات الراكدة</h3>
              <p className="text-rose-800/80 text-base sm:text-lg leading-relaxed">
                البطالة ليست قدراً، بل هي نتيجة لاختيار تخصصات مشبعة. تتركز البطالة في الأردن في تخصصات العلوم الإنسانية والتربوية التقليدية.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/60 p-5 rounded-2xl border border-rose-200 text-right">
                <span className="text-xs font-black text-rose-600 block mb-2">تجنب (التشبع العالي):</span>
                <p className="text-sm text-rose-900 leading-relaxed font-medium">اللغات التقليدية، الإدارة العامة، التربية الأساسية، الفلسفة.</p>
              </div>
              <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-200 text-right">
                <span className="text-xs font-black text-emerald-700 block mb-2">استهدف (الطلب العالي):</span>
                <p className="text-sm text-emerald-900 leading-relaxed font-medium">الذكاء الاصطناعي، الأمن الرقمي، التمريض المتخصص، هندسة الأنظمة الذكية.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Demand Jobs and Success Tips */}
      <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 items-stretch">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-emerald-500 rounded-full"></div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 text-right">أكثر 5 مهن طلباً في الأردن 2026</h3>
          </div>
          <div className="space-y-4">
            {[
              { title: "أمن سيبراني ومحلل بيانات ضخمة", desc: "لحماية البنية التحتية والقطاع المصرفي والخدمات الحكومية الرقمية.", icon: "🛡️" },
              { title: "تمريض ورعاية متخصصة", desc: "مع توسع المنشآت الطبية والسياحة العلاجية في المملكة.", icon: "🩺" },
              { title: "تقنيات الطاقة المستدامة والهيدروجين", desc: "توسع الأردن في مشاريع الرياح والشمس والهيدروجين الأخضر.", icon: "🌱" },
              { title: "فنيو الأتمتة والذكاء الاصطناعي", desc: "الطلب مرتفع في القطاع الصناعي الحديث والمدن الذكية.", icon: "⚙️" },
              { title: "تطوير حلول الـ Fintech", desc: "النمو الهائل في الدفع الإلكتروني والخدمات المالية الرقمية.", icon: "💳" }
            ].map((job, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-5 hover:border-emerald-300 hover:shadow-lg transition-all group text-right">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-emerald-50 transition-colors">{job.icon}</div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg mb-1 group-hover:text-emerald-700 transition-colors">{job.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{job.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improved Success Tips Section */}
        <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-14 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mt-40 -mr-40"></div>
          
          <div className="relative z-10 space-y-12">
            <div className="text-right">
              <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">Jordan Market Insights 2026</div>
              <h3 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">نصائح الانطلاق 🎯</h3>
              <p className="text-slate-400 font-light leading-relaxed max-w-md ml-auto">
                التميز المهني في 2026 يتطلب استراتيجية ذكية. إليك 3 ركائز أساسية للنجاح:
              </p>
            </div>

            <div className="space-y-6">
              {[
                { n: "01", t: "إتقان اللغة الإنجليزية التقنية", d: "ليست مجرد مادة دراسية، بل هي لغة العلم والبرمجيات والمصادر العالمية. إتقانها يفتح لك أبواب الشركات الدولية." },
                { n: "02", t: "أدوات الذكاء الاصطناعي التوليدي", d: "تعلم كيف تدمج الـ AI في مجالك. المحاسب أو المهندس الذي يستخدم الذكاء الاصطناعي يتفوق دائماً على غيره." },
                { n: "03", t: "المهارات الناعمة والذكاء العاطفي", d: "القدرة على حل المشكلات المعقدة، العمل الجماعي، والذكاء العاطفي هي المهارات التي لا يمكن للآلة استبدالها." }
              ].map((item, i) => (
                <div key={i} className="group flex flex-col sm:flex-row-reverse items-start gap-6 p-6 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all text-right">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-500/20 group-hover:text-emerald-500 transition-colors italic leading-none shrink-0">
                    {item.n}
                  </span>
                  <div className="space-y-2">
                    <h5 className="font-black text-white text-lg sm:text-xl">{item.t}</h5>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <button 
              onClick={() => setActiveTab('quiz')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>ابدأ تقييمك الشخصي الآن</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / QUESTIONS.length) * 100;

    if (scores) {
      const sortedCategories = getSortedCategories(scores);
      const topTwo = sortedCategories.slice(0, 2);
      const isInitialAnalysisPending = isChatLoading && !aiAnalysis;
      
      return (
        <>
          <div className="print:hidden max-w-7xl mx-auto space-y-8 sm:space-y-12 py-12 px-4 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner rotate-3">🎓</div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">بصمتك المهنية المكتشفة</h2>
              <p className="text-slate-500 text-lg sm:text-xl font-light leading-relaxed">
                لقد حللنا ردودك بدقة. هذه النتائج تعكس إمكانياتك الكامنة ونقاط قوتك الفريدة.
              </p>
            </div>

            {/* PDF Export & Print Action Card */}
            <div className="bg-white border-2 border-emerald-100 rounded-[2rem] sm:rounded-[2.75rem] p-6 sm:p-8 shadow-xl shadow-emerald-900/5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">
                    <span>📄</span>
                    <span>وثيقة رسمية قابلة للطباعة والحفظ</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    تصدير التقرير المهني الشامل (PDF)
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    أضف اسمك وصفك الدراسي (اختياري) ليظهر في التقرير الرسمي قبل تحميله أو طباعته للاحتفاظ به أو عرضه على المرشد التربوي.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf || isInitialAnalysisPending}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-7 py-4 rounded-2xl font-black text-sm sm:text-base transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2.5"
                  >
                    {isExportingPdf ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>جاري تجهيز ملف PDF...</span>
                      </>
                    ) : isInitialAnalysisPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>بانتظار اكتمال التحليل الذكي...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>تحميل التقرير (PDF)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePrintReport}
                    disabled={isInitialAnalysisPending || isExportingPdf}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 px-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>طباعة التقرير</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-right space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 pr-1">
                    اسم الطالب (اختياري للتوثيق في التقرير)
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: أحمد محمد العلي"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all text-right placeholder:text-slate-400"
                  />
                </div>
                <div className="text-right space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 pr-1">
                    الصف / الفرع الأكاديمي (اختياري)
                  </label>
                  <input
                    type="text"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    placeholder="مثال: الأول ثانوي علمي - شعبة أ"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all text-right placeholder:text-slate-400"
                  />
                </div>
              </div>

              {pdfStatus === 'success' && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 text-right">
                  <span>✅</span>
                  <span>تم تجهيز وتحميل ملف التقرير المهني (PDF) بنجاح على جهازك.</span>
                </div>
              )}
              {pdfStatus === 'error' && (
                <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 text-right">
                  <span>⚠️</span>
                  <span>تعذر تصدير ملف PDF حالياً، يمكنك استخدام زر «طباعة التقرير» واختيار الحفظ كملف PDF.</span>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 items-start">
            <div className="lg:col-span-7 space-y-8 sm:space-y-10">
              <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-40"></div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-6 flex items-center gap-4 relative z-10 text-right">
                  <span className="w-2 h-9 bg-emerald-500 rounded-full"></span>
                  المخطط الراداري للميول
                </h3>
                <div className="relative z-10">
                  <CareerChart scores={scores} />
                </div>

                {/* Visual Icon Key for the 6 Radar Vertices */}
                <div className="relative z-10 mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['R', 'I', 'A', 'S', 'E', 'C'] as RIASECKey[]).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2.5 bg-slate-50/80 border border-slate-100 rounded-2xl px-3.5 py-2.5 text-right"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <RiasecIcon type={key} size="xs" />
                        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {RIASEC_INFO[key].label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-black tabular-nums shrink-0"
                        style={{ color: RIASEC_INFO[key].color }}
                      >
                        {Math.round((scores[key] / 25) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Two Dominant Personality Cards with Illustrative Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {topTwo.map(([key, score], idx) => {
                  const percent = Math.round((score / 25) * 100);
                  const arabicRanks = ['١', '٢'];
                  return (
                    <div
                      key={key}
                      className="bg-white p-7 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden relative text-right flex flex-col justify-between"
                    >
                      <div
                        className="absolute top-0 left-0 w-full h-1.5"
                        style={{ backgroundColor: RIASEC_INFO[key].color }}
                      ></div>
                      <div>
                        <div className="flex justify-between items-start gap-3 mb-5">
                          <div className="flex items-center gap-3">
                            <RiasecIcon type={key} size="lg" />
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block">
                                {idx === 0 ? 'الميل الأول السائد' : 'الميل الثاني المساند'} · مرتبة {arabicRanks[idx]}
                              </span>
                              <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                                {RIASEC_INFO[key].label}
                              </h4>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <span
                              className="text-2xl font-black tabular-nums block leading-none"
                              style={{ color: RIASEC_INFO[key].color }}
                            >
                              {percent}%
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums mt-1 block">
                              {score} / 25
                            </span>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-slate-600 mb-2">
                          {RIASEC_INFO[key].enLabel} · {key} · {RIASEC_INFO[key].traitTag}
                        </p>
                        <p className="text-slate-500 text-sm leading-relaxed font-light">
                          {RIASEC_INFO[key].desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Complete Breakdown of All 6 Holland Personality Types with Illustrative Icons */}
              <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6 text-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <span className="w-2 h-8 bg-emerald-500 rounded-full shrink-0"></span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        نتائج شخصيات هولاند الستة التفصيلية
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-light mt-0.5">
                        توزيع درجاتك عبر جميع الأنماط المهنية الستة مع الدلالة البصرية لكل شخصية
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedCategories.map(([key, score], idx) => {
                    const percent = Math.round((score / 25) * 100);
                    const arabicRanks = ['١', '٢', '٣', '٤', '٥', '٦'];
                    const info = RIASEC_INFO[key];
                    return (
                      <div
                        key={key}
                        className="p-4 sm:p-5 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-slate-200 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-black text-xs flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                              {arabicRanks[idx]}
                            </span>
                            <RiasecIcon type={key} size="md" />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <h4 className="text-base sm:text-lg font-black text-slate-900">
                                  النمط {info.label}
                                </h4>
                                <span className="text-xs font-bold text-slate-400">
                                  ({info.enLabel} · {key})
                                </span>
                              </div>
                              <p className="text-xs font-bold" style={{ color: info.color }}>
                                {info.traitTag}
                              </p>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span
                              className="text-lg sm:text-xl font-black tabular-nums block leading-none"
                              style={{ color: info.color }}
                            >
                              {percent}%
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums mt-1 block">
                              {score} من 25
                            </span>
                          </div>
                        </div>

                        <div className="mt-3.5 w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(4, percent)}%`,
                              backgroundColor: info.color,
                            }}
                          ></div>
                        </div>

                        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-light">
                          {info.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]"></div>
                <div className="flex flex-row-reverse items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">✨</div>
                  <div className="text-right">
                    <h4 className="font-black text-xl">التحليل الذكي</h4>
                    <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">Strategic AI Report</p>
                  </div>
                </div>
                <div className="text-slate-300">
                  {isChatLoading && !aiAnalysis ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                      <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                    </div>
                  ) : formatAiText(aiAnalysis)}
                </div>
              </div>

              {/* Chat Support */}
              <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col h-[600px] relative">
                <div className="flex flex-row-reverse items-center gap-3 mb-8 shrink-0">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <h4 className="font-black text-lg text-slate-800">ناقش نتائجك مع المستشار الذكي</h4>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 space-y-4 px-2 custom-scrollbar">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-16 text-slate-300">
                      <p className="text-4xl mb-4 opacity-50">💭</p>
                      <p className="text-sm px-8 leading-relaxed font-light">تحدث معي عن تخصص معين يهمك، أو اسألني كيف تنطبق نتائجك على سوق العمل الأردني!</p>
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
                      <div className={`max-w-[85%] px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed text-right ${
                        m.role === 'user' 
                        ? 'bg-slate-100 text-slate-700 rounded-br-none' 
                        : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 rounded-bl-none font-medium'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && aiAnalysis && (
                    <div className="flex gap-2 p-2 justify-end">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="relative shrink-0">
                  <input 
                    type="text" 
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                    placeholder="اكتب سؤالك هنا..."
                    disabled={isChatLoading}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all pr-14 pl-24 text-right placeholder:text-slate-400"
                  />
                  <div className="absolute left-2 top-2 bottom-2 flex gap-2">
                    <button 
                      onClick={toggleListening}
                      disabled={isChatLoading}
                      className={`px-3 rounded-xl transition-all flex items-center justify-center shadow-lg ${
                        isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                      title="تحدث الآن"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleSendMessage} 
                      disabled={isChatLoading || !currentInput.trim()}
                      className="bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 text-white px-4 rounded-xl transition-all flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
            <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf || isInitialAnalysisPending}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-full font-black transition-all text-sm shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{isExportingPdf ? 'جاري تجهيز ملف PDF...' : 'تحميل التقرير كملف PDF'}</span>
              </button>

              <button 
                onClick={() => {setScores(null); setAnswers({}); setAiAnalysis(''); setChatMessages([]); setPdfStatus('idle');}}
                className="px-10 py-4 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-all text-sm"
              >
                إعادة المقياس مرة أخرى
              </button>
            </div>
          </div>

          {/* Printable & PDF Export A4 Report Container */}
          <div
            id="bowsalti-pdf-wrapper"
            className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none print:static print:w-full print:h-auto print:overflow-visible print:pointer-events-auto"
          >
            <PdfReportTemplate
              ref={pdfReportRef}
              scores={scores}
              aiAnalysis={aiAnalysis}
              studentName={studentName}
              studentGrade={studentGrade}
              generatedAt={reportGeneratedAt}
            />
          </div>
        </>
      );
    }

    const quizScale = [
      { val: 1, numeral: '١', label: 'لا تنطبق أبداً' },
      { val: 2, numeral: '٢', label: 'نادراً' },
      { val: 3, numeral: '٣', label: 'أحياناً' },
      { val: 4, numeral: '٤', label: 'غالباً' },
      { val: 5, numeral: '٥', label: 'تنطبق تماماً' },
    ];

    if (!quizStarted) {
      return (
        <div className="max-w-3xl mx-auto text-center space-y-10 py-14 sm:py-24 px-4 animate-in zoom-in-95 duration-500">
          <div className="text-7xl animate-bounce">📝</div>
          <div className="space-y-4">
            <h3 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">مقياس الميول المهنية</h3>
            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed">
              لقد صممنا هذا المقياس بناءً على أحدث الدراسات البحثية في مدرسة أحمد اللوزي الثانوية للبنين لمساعدتك على تحديد هويتك المهنية بدقة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">✓</span>
              <p className="text-base font-bold text-slate-700">30 سؤالاً بحثياً تغطي كافة الميول المهنية.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">✓</span>
              <p className="text-base font-bold text-slate-700">نتائج فورية وتحليل ذكاء اصطناعي مخصص.</p>
            </div>
          </div>

          {/* Clear Scale Guide before starting */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border-2 border-emerald-100 shadow-md text-right space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-2 h-7 bg-emerald-600 rounded-full"></span>
              <h4 className="text-lg sm:text-xl font-black text-slate-900">مفتاح الإجابة على فقرات المقياس:</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {quizScale.map((option) => (
                <div
                  key={option.val}
                  className="flex sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-center"
                >
                  <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    {option.numeral}
                  </span>
                  <span className="text-base sm:text-sm font-black text-slate-800 leading-snug">
                    <span className="sm:hidden">= </span>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setQuizStarted(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl sm:rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-emerald-200 active:scale-95"
          >
            ابدأ المقياس الآن
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-36 pt-10 animate-in fade-in duration-500 px-4">
        {/* Sticky Header Progress + Clear Scale Reference */}
        <div className="sticky top-20 z-[90] bg-white/95 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border-2 border-slate-200/80 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base font-black text-slate-800">
              الأسئلة المنجزة: {answeredCount} من {QUESTIONS.length}
            </span>
            <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs sm:text-sm font-black">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-emerald-600 to-teal-400 transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs sm:text-sm font-extrabold text-slate-800">
            {quizScale.map((option) => (
              <span
                key={option.val}
                className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl"
              >
                <span className="text-emerald-700 font-black">{option.numeral}</span>
                <span className="text-slate-400">=</span>
                <span>{option.label}</span>
              </span>
            ))}
          </div>
        </div>

        {QUESTIONS.map((q, idx) => {
          const selectedVal = answers[q.id];
          return (
            <div 
              key={q.id} 
              className={`bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.75rem] border-2 transition-all duration-300 text-right ${
                selectedVal 
                ? 'border-emerald-300 bg-emerald-50/15 shadow-md' 
                : 'border-slate-200/80 shadow-xl'
              }`}
            >
              <div className="flex items-start gap-4 sm:gap-5 mb-8">
                <span className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-base sm:text-lg font-black shrink-0 shadow-md transition-colors ${
                  selectedVal ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-[1.6]">{q.text}</p>
                  {selectedVal && (
                    <span className="inline-block text-xs font-extrabold text-emerald-700">
                      تم الاختيار: {quizScale.find(o => o.val === selectedVal)?.numeral} = {quizScale.find(o => o.val === selectedVal)?.label} ✓
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-3.5">
                {quizScale.map((option) => {
                  const isSelected = selectedVal === option.val;
                  return (
                    <button
                      key={option.val}
                      type="button"
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [q.id]: option.val }));
                      }}
                      className={`group flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-2.5 px-5 py-4 sm:px-3 sm:py-5 rounded-2xl border-2 transition-all ${
                        isSelected 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-100' 
                        : 'bg-slate-50/80 border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-950'
                      }`}
                    >
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-2">
                        <span className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-black transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-white border border-slate-200 text-emerald-700 group-hover:border-emerald-300'
                        }`}>
                          {option.numeral}
                        </span>
                        <span className={`text-base sm:text-[15px] font-black leading-snug sm:text-center ${
                          isSelected ? 'text-white' : 'text-slate-800 group-hover:text-emerald-950'
                        }`}>
                          <span className="sm:hidden text-slate-400 ml-1.5 font-bold">=</span>
                          {option.label}
                        </span>
                      </div>
                      <span className={`sm:hidden w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected ? 'border-white bg-white text-emerald-700' : 'border-slate-300'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="fixed bottom-8 left-0 right-0 px-4 z-[100] flex justify-center">
          <button 
            onClick={calculateResult} 
            disabled={Object.keys(answers).length < QUESTIONS.length}
            className="w-full max-w-lg bg-slate-900 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-5 rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl transition-all shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex items-center justify-center gap-4 group"
          >
            <span>
              {Object.keys(answers).length < QUESTIONS.length
                ? `أكمل الإجابة على جميع الأسئلة (${answeredCount} / ${QUESTIONS.length})`
                : 'استعرض التقرير النهائي'}
            </span>
            {Object.keys(answers).length >= QUESTIONS.length && (
              <svg className="w-6 h-6 animate-pulse rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSessions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 py-12 max-w-7xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="md:col-span-2 lg:col-span-3 text-center space-y-4 mb-12 pt-8">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">الجلسات الإرشادية</h2>
        <p className="text-slate-500 text-lg sm:text-xl font-light max-w-2xl mx-auto">
          برنامج متكامل من 6 جلسات مصممة لمرافقتك في رحلة اختيار المستقبل.
        </p>
      </div>
      {SESSIONS.map((session) => (
        <div 
          key={session.id} 
          onClick={() => setSelectedSession(session)}
          className="group relative flex flex-col bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 cursor-pointer overflow-hidden h-full text-right"
        >
          <div className="h-2 w-full bg-emerald-500/10 group-hover:bg-emerald-500 transition-colors duration-500 shrink-0"></div>
          <div className="p-8 sm:p-12 flex-1">
            <div className="text-6xl mb-8 transform transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12 inline-block drop-shadow-sm shrink-0">
              {session.icon}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 group-hover:text-emerald-700 transition-colors leading-tight">
              {session.title}
            </h3>
            <p className="text-slate-500 text-base leading-relaxed font-light mb-6">
              {session.description}
            </p>
            <div className="pt-6 border-t border-slate-50 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">الهدف الاستراتيجي:</span>
              <p className="text-lg font-black text-slate-700 leading-snug">{session.objective}</p>
            </div>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 text-emerald-600 font-black text-sm group-hover:gap-4 transition-all">
                اقرأ المزيد
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedSession(null)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 text-right">
            <div className="h-3 w-full bg-emerald-600"></div>
            <button 
              onClick={() => setSelectedSession(null)}
              className="absolute top-6 left-6 w-10 h-10 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full flex items-center justify-center transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="p-8 sm:p-16 space-y-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="text-8xl animate-bounce-slow">{selectedSession.icon}</div>
                <div className="space-y-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">{selectedSession.title}</h3>
                  <p className="text-emerald-600 font-black tracking-widest uppercase text-xs">Guidance Session Details</p>
                </div>
              </div>

              <div className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نظرة عامة</span>
                  <p className="text-slate-600 text-lg leading-relaxed font-light">{selectedSession.description}</p>
                </div>
                <div className="pt-6 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">التفاصيل العميقة</span>
                  <p className="text-slate-800 text-lg leading-relaxed font-bold">{selectedSession.detailedInfo}</p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
                >
                  فهمت، شكراً لك
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in duration-700">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'market' && renderMarket()}
        {activeTab === 'quiz' && renderQuiz()}
        {activeTab === 'sessions' && renderSessions()}
      </div>
    </Layout>
  );
};

export default App;
