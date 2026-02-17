
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Home, 
  Egg, 
  PawPrint, 
  Calendar as CalendarIcon, 
  Box, 
  BookOpen, 
  CloudSun, 
  Plus, 
  Minus, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  Moon,
  Sun,
  X,
  Check,
  Camera,
  ThermometerSnowflake,
  ThermometerSun,
  ExternalLink,
  MessageSquare,
  PencilLine
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  format, 
  parseISO, 
  differenceInMonths, 
  differenceInYears, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { it } from 'date-fns/locale';

import { Animal, AnimalType, EggLog, EventLog, StockItem, DiaryNote, WeatherData } from './types';
import { fetchWeather } from './services/weatherService';
import { getFarmInsights } from './services/geminiService';

// --- Sub-components ---

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 ${
      active ? 'bg-lime-600 text-white shadow-lg scale-105' : 'bg-white text-slate-500 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-4 ${className}`}>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-3 outline-none focus:border-lime-500 transition-colors text-slate-900 dark:text-white" />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-3 outline-none focus:border-lime-500 transition-colors appearance-none text-slate-900 dark:text-white" />
);

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isNightMode, setIsNightMode] = useState(() => localStorage.getItem('nightMode') === 'true');
  
  // Farm Data State
  const [animals, setAnimals] = useState<Animal[]>(() => JSON.parse(localStorage.getItem('animals') || '[]'));
  const [eggs, setEggs] = useState<EggLog>(() => JSON.parse(localStorage.getItem('eggs') || '{}'));
  const [events, setEvents] = useState<EventLog[]>(() => JSON.parse(localStorage.getItem('events') || '[]'));
  const [stock, setStock] = useState<StockItem[]>(() => JSON.parse(localStorage.getItem('stock') || '[]'));
  const [notes, setNotes] = useState<DiaryNote[]>(() => JSON.parse(localStorage.getItem('notes') || '[]'));
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  // UI States
  const [showAnimalForm, setShowAnimalForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ summary: string; alerts: string[]; recommendations: string[] } | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [geminiNoteInput, setGeminiNoteInput] = useState('');
  
  // Calendar UI State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('animals', JSON.stringify(animals));
    localStorage.setItem('eggs', JSON.stringify(eggs));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('stock', JSON.stringify(stock));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('nightMode', JSON.stringify(isNightMode));
    
    if (isNightMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [animals, eggs, events, stock, notes, isNightMode]);

  useEffect(() => {
    fetchWeather().then(setWeather);
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const updateEggs = (delta: number) => {
    setEggs(prev => ({
      ...prev,
      [todayStr]: Math.max(0, (prev[todayStr] || 0) + delta)
    }));
  };

  const generateInsights = async () => {
    setIsAiLoading(true);
    try {
      const insights = await getFarmInsights(animals, eggs, stock, notes);
      setAiInsights(insights);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveGeminiNote = () => {
    if (!geminiNoteInput.trim()) return;
    const newNote: DiaryNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: `[Gemini Note] ${geminiNoteInput.trim()}`
    };
    setNotes([newNote, ...notes]);
    setGeminiNoteInput('');
    alert('Appunto salvato nel diario!');
  };

  const getDisplayStock = useCallback((item: StockItem) => {
    const passedDays = (Date.now() - item.lastRefill) / (1000 * 60 * 60 * 24);
    const current = Math.max(0, item.currentQty - (passedDays * item.dailyConsumption));
    const percentage = (current / item.initialQty) * 100;
    return { current: current.toFixed(1), percentage };
  }, []);

  const getAge = (birthDate: string) => {
    if (!birthDate) return "N.D.";
    const birth = parseISO(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    return years > 0 ? `${years}a ${months}m` : `${months}m`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAnimal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAnimal: Animal = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      type: formData.get('type') as AnimalType,
      birth: formData.get('birth') as string,
      sex: formData.get('sex') as 'F' | 'M',
      breed: formData.get('breed') as string,
      notes: formData.get('notes') as string,
      img: tempPhoto || undefined
    };
    if (!newAnimal.name) return;
    setAnimals([...animals, newAnimal]);
    setShowAnimalForm(false);
    setTempPhoto(null);
  };

  const handleAddStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      initialQty: parseFloat(formData.get('qty') as string),
      currentQty: parseFloat(formData.get('qty') as string),
      dailyConsumption: parseFloat(formData.get('daily') as string),
      lastRefill: Date.now()
    };
    if (!newItem.name || isNaN(newItem.initialQty)) return;
    setStock([...stock, newItem]);
    setShowStockForm(false);
  };

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEvent: EventLog = {
      id: Date.now().toString(),
      type: formData.get('type') as 'medical' | 'work',
      animalId: formData.get('animalId') as string,
      desc: formData.get('desc') as string,
      date: formData.get('date') as string,
    };
    if (!newEvent.desc || !newEvent.date) return;
    setEvents([...events, newEvent]);
    setShowEventForm(false);
  };

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayEvents = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter(e => e.date === dayStr);
  };

  // --- Tomorrow Alert Logic ---
  const tomorrowAlert = useMemo(() => {
    if (!weather || !weather.daily[1]) return null;
    const tomorrow = weather.daily[1];
    if (tomorrow.minTemp < 2) {
      return { 
        type: 'cold', 
        msg: `Domani gelo previsto! Minima di ${tomorrow.minTemp}°C. Proteggi gli animali più sensibili.`,
        icon: <ThermometerSnowflake className="text-blue-500 animate-pulse" />
      };
    }
    if (tomorrow.maxTemp > 33) {
      return { 
        type: 'heat', 
        msg: `Domani caldo torrido! Massima di ${tomorrow.maxTemp}°C. Assicura acqua fresca e ombra.`,
        icon: <ThermometerSun className="text-orange-500 animate-pulse" />
      };
    }
    return null;
  }, [weather]);

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 ${isNightMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`safe-area-pt pt-12 pb-8 px-6 transition-all duration-300 ${isNightMode ? 'bg-slate-800' : 'bg-lime-600'} rounded-b-[40px] text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Fattoria Smart</h1>
            <p className="opacity-80 text-sm font-medium">Gestione Pro v2.5</p>
          </div>
          <button 
            onClick={() => setIsNightMode(!isNightMode)}
            className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all"
          >
            {isNightMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </header>

      {/* Navigation Grid */}
      <nav className="px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
          <NavItem icon={<Home size={20} />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Egg size={20} />} label="Uova" active={activeTab === 'uova'} onClick={() => setActiveTab('uova')} />
          <NavItem icon={<PawPrint size={20} />} label="Animali" active={activeTab === 'animali'} onClick={() => setActiveTab('animali')} />
          <NavItem icon={<CalendarIcon size={20} />} label="Eventi" active={activeTab === 'eventi'} onClick={() => setActiveTab('eventi')} />
          <NavItem icon={<Box size={20} />} label="Scorte" active={activeTab === 'scorte'} onClick={() => setActiveTab('scorte')} />
          <NavItem icon={<BookOpen size={20} />} label="Diario" active={activeTab === 'diario'} onClick={() => setActiveTab('diario')} />
          <NavItem icon={<CloudSun size={20} />} label="Meteo" active={activeTab === 'meteo'} onClick={() => setActiveTab('meteo')} />
          <NavItem icon={<Sparkles size={20} />} label="AI" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        </div>
      </nav>

      <main className="px-4 mt-8 max-w-2xl mx-auto">
        
        {/* HOME SECTION */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {tomorrowAlert && (
              <div className={`mb-4 p-5 rounded-3xl border-2 flex items-center gap-4 animate-bounce-short ${tomorrowAlert.type === 'cold' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900' : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900'}`}>
                <div className="shrink-0">{tomorrowAlert.icon}</div>
                <div className="flex-1">
                   <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${tomorrowAlert.type === 'cold' ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>Avviso Meteo Domani</h4>
                   <p className="text-sm font-bold leading-snug">{tomorrowAlert.msg}</p>
                </div>
              </div>
            )}

            <Card className="text-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-slate-800 border-none">
              <h3 className="text-orange-800 dark:text-orange-400 font-bold text-xs uppercase tracking-widest mb-2">Produzione Odierna</h3>
              <div className="text-7xl font-black text-orange-600 dark:text-orange-500 my-4 drop-shadow-sm">{eggs[todayStr] || 0}</div>
              <div className="flex justify-center gap-6">
                <button onClick={() => updateEggs(-1)} className="w-14 h-14 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"><Minus size={24} /></button>
                <button onClick={() => updateEggs(1)} className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Plus size={24} /></button>
              </div>
            </Card>

            {weather && (
              <div className={`rounded-3xl p-5 mb-4 flex items-center justify-between shadow-sm border ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900 text-blue-500 rounded-2xl"><CloudSun size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oggi</p>
                    <p className="text-xl font-bold">{weather.temp}°C</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umidità</p>
                  <p className="text-xl font-bold">{weather.humidity}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* METEO SECTION */}
        {activeTab === 'meteo' && weather && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6">Previsioni Settimanali</h2>
            <div className="space-y-3">
              {weather.daily.map(day => (
                <div key={day.time} className="p-5 rounded-3xl border bg-white dark:bg-slate-800 dark:border-slate-700 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl drop-shadow-sm">{day.code < 3 ? '☀️' : day.code < 50 ? '☁️' : '🌧️'}</span>
                    <div>
                      <p className="font-bold text-lg leading-tight">{isToday(parseISO(day.time)) ? 'Oggi' : format(parseISO(day.time), 'EEEE d', { locale: it })}</p>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Umidità: {day.humidity}%</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-2">
                       <span className="text-rose-500 text-sm font-black">↑</span>
                       <span className="text-2xl font-black">{day.maxTemp}°</span>
                    </div>
                    <div className="flex items-center gap-2 -mt-1 opacity-60">
                       <span className="text-blue-500 text-xs font-black">↓</span>
                       <span className="text-sm font-bold">{day.minTemp}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI SECTION */}
        {activeTab === 'ai' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl text-white shadow-xl"><Sparkles size={24} /></div>
              <h2 className="text-2xl font-black">AI Advisor</h2>
            </div>
            
            {!aiInsights ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-6 max-w-xs mx-auto text-sm font-medium">Analizza i dati della tua fattoria usando la potenza di Google Gemini.</p>
                <button onClick={generateInsights} disabled={isAiLoading} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-3xl font-black shadow-2xl flex items-center gap-3 mx-auto active:scale-95 transition-transform disabled:opacity-50">
                  {isAiLoading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                  {isAiLoading ? "Analizzando..." : "Analizza Fattoria"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border-indigo-100 dark:border-indigo-900">
                  <h3 className="font-black text-indigo-800 dark:text-indigo-400 uppercase text-[10px] mb-3">Riepilogo AI</h3>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{aiInsights.summary}</p>
                </Card>
                <button onClick={() => setAiInsights(null)} className="w-full text-xs font-bold text-slate-400 uppercase py-4 hover:text-indigo-500 transition-colors">Nuova Analisi</button>
              </div>
            )}

            {/* Gemini Notebook Section */}
            <Card className="mt-8 border-t-4 border-t-indigo-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                  <PencilLine size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Appunti da Gemini</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Cosa hai imparato oggi conversando con Gemini? Salvalo qui per ritrovarlo nel tuo diario.</p>
              <textarea 
                value={geminiNoteInput}
                onChange={(e) => setGeminiNoteInput(e.target.value)}
                placeholder="Esempio: Gemini mi ha consigliato di aggiungere calcio alla dieta delle galline per gusci più resistenti..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 min-h-[120px] outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white mb-4 resize-none"
              />
              <button 
                onClick={saveGeminiNote}
                disabled={!geminiNoteInput.trim()}
                className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40"
              >
                <Check size={18} /> Salva nel Diario
              </button>
            </Card>

            {/* Gemini Integration Resources */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Risorse Google Gemini</h3>
              <a 
                href="https://gemini.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-600 transition-all group mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Chiedi a Gemini</h4>
                      <p className="text-xs text-slate-400 font-medium">Vai alla chat ufficiale per approfondimenti</p>
                    </div>
                  </div>
                  <ExternalLink size={18} className="text-slate-300 group-hover:text-indigo-500" />
                </div>
              </a>

              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-tighter">
                  Powered by <span className="text-indigo-500 dark:text-indigo-400">Google Gemini AI</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the sections (uova, animali, eventi, scorte, diario) remain unchanged but integrated in the full App component */}
        {activeTab === 'uova' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6">Produzione Uova</h2>
            <Card className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Object.entries(eggs).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date)).slice(-7)}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isNightMode ? "#334155" : "#f1f5f9"} />
                  <XAxis dataKey="date" tickFormatter={(str) => format(parseISO(str), 'dd/MM')} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {activeTab === 'animali' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">I Tuoi Animali</h2>
              <button className={`p-2 rounded-xl shadow-lg transition-colors ${showAnimalForm ? 'bg-rose-500' : 'bg-lime-600'} text-white`} onClick={() => { setShowAnimalForm(!showAnimalForm); setTempPhoto(null); }}>
                {showAnimalForm ? <X size={24} /> : <Plus size={24} />}
              </button>
            </div>
            {showAnimalForm && (
              <Card className="border-2 border-lime-500 animate-in slide-in-from-top-4">
                <form onSubmit={handleAddAnimal}>
                  <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-lime-600 text-center">Nuovo Profilo Animale</h3>
                  <div className="flex flex-col items-center mb-6">
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer relative hover:border-lime-500 transition-colors">
                      {tempPhoto ? <img src={tempPhoto} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="text-slate-400" size={32} />}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                  </div>
                  <Input name="name" placeholder="Nome Animale" required />
                  <Select name="type">
                    {Object.values(AnimalType).map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input name="birth" type="date" placeholder="Nascita" />
                  <button type="submit" className="w-full bg-lime-600 text-white font-bold py-4 rounded-xl shadow-lg">Salva Animale</button>
                </form>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animals.map(animal => (
                <Card key={animal.id} className="p-4 relative overflow-hidden group">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                      {animal.img ? <img src={animal.img} alt={animal.name} className="w-full h-full object-cover" /> : animal.type.split(' ')[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{animal.name}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase">{animal.type}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'eventi' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6 text-center">Eventi</h2>
            <Card className="p-4 mb-6">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                <h3 className="font-black text-lg uppercase tracking-wider">{format(currentMonth, 'MMMM yyyy', { locale: it })}</h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ChevronRight size={20} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[10px] font-black text-slate-400 uppercase">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => <span key={day}>{day}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getDayEvents(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  return (
                    <div key={idx} onClick={() => setSelectedDay(isSelected ? null : day)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl cursor-pointer relative ${!isCurrentMonth ? 'opacity-20 pointer-events-none' : ''} ${isSelected ? 'bg-lime-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <span className="text-sm font-bold">{format(day, 'd')}</span>
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.some(e => e.type === 'medical') && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                        {dayEvents.some(e => e.type === 'work') && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'scorte' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6">Magazzino</h2>
            {stock.map((item, idx) => {
              const { current, percentage } = getDisplayStock(item);
              const color = percentage < 20 ? 'bg-rose-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <Card key={item.id} className="relative">
                  <div className="flex justify-between items-center mb-3 font-black uppercase tracking-wider">
                    <h3>{item.name}</h3>
                    <span>{current} kg</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'diario' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6">Diario Fattoria</h2>
            <div className="mb-6 p-4 rounded-3xl bg-white dark:bg-slate-800 border dark:border-slate-700">
              <textarea id="diaryInput" className="w-full bg-transparent p-2 min-h-[100px] outline-none text-lg resize-none text-slate-900 dark:text-white" placeholder="Cosa è successo oggi?" />
              <div className="flex justify-end mt-2">
                <button onClick={() => {
                    const el = document.getElementById('diaryInput') as HTMLTextAreaElement;
                    if (!el.value.trim()) return;
                    setNotes([{ id: Date.now().toString(), date: new Date().toISOString(), text: el.value.trim() }, ...notes]);
                    el.value = "";
                }} className="bg-lime-600 text-white px-6 py-2 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">Salva</button>
              </div>
            </div>
            {notes.map(note => (
              <div key={note.id} className="p-5 rounded-3xl border bg-white dark:bg-slate-800 dark:border-slate-700 mb-4">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">{format(parseISO(note.date), 'd MMM yyyy HH:mm', { locale: it })}</p>
                <p className={`italic text-slate-700 dark:text-slate-300 ${note.text.includes('[Gemini Note]') ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>"{note.text}"</p>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 safe-area-pb z-50">
        <div className="flex justify-around py-4 px-2">
           <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-lime-600' : 'text-slate-400'}><Home size={24} /></button>
           <button onClick={() => setActiveTab('uova')} className={activeTab === 'uova' ? 'text-orange-500' : 'text-slate-400'}><Egg size={24} /></button>
           <button onClick={() => setActiveTab('animali')} className={activeTab === 'animali' ? 'text-lime-600' : 'text-slate-400'}><PawPrint size={24} /></button>
           <button onClick={() => setActiveTab('eventi')} className={activeTab === 'eventi' ? 'text-lime-600' : 'text-slate-400'}><CalendarIcon size={24} /></button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
