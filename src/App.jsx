import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

export default function App() {
  // Navegação e listagem
  const [activeTab, setActiveTab] = useState('surfer'); // 'surfer' | 'create'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do modal de reserva
  const [selectedSession, setSelectedSession] = useState(null);
  const [surferName, setSurferName] = useState('');
  const [surferContact, setSurferContact] = useState('');

  // Estados de criação de nova sessão
  const [newBeach, setNewBeach] = useState('');
  const [newDate, setNewDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newSpots, setNewSpots] = useState(4);
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Modal da comunidade
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  // Leitura em tempo real do Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'sessions'),
      (snapshot) => {
        const docsList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setSessions(docsList);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao ler sessões do Firestore:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleOpenReserve = (session) => {
    setSelectedSession(session);
    setSurferName('');
    setSurferContact('');
  };

  // Gera o link do WhatsApp com os dados da sessão e do surfista
  const getWhatsappUrl = () => {
    if (!selectedSession) return '#';
    let cleanPhone = (selectedSession.whatsapp || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9) cleanPhone = '351' + cleanPhone;

    const details = `${selectedSession.beach}${selectedSession.date ? ` (${selectedSession.date} às ${selectedSession.time})` : ''}`;
    const namePart = surferName.trim() ? `O meu nome é ${surferName.trim()}` : '';
    const contactPart = surferContact.trim() ? ` (contacto: ${surferContact.trim()})` : '';
    const textMessage = `Olá! Vi a tua sessão no SurfLens para ${details}. ${namePart}${contactPart}. Ainda tens vaga para mim?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`;
  };

  // Ao carregar no botão do WhatsApp: desconta a vaga em background e fecha o modal
  const handleWhatsappClick = () => {
    if (selectedSession && selectedSession.spots > 0) {
      // Registo em segundo plano (fire-and-forget) sem bloquear a abertura da app
      updateDoc(doc(db, 'sessions', selectedSession.id), {
        spots: Math.max(0, Number(selectedSession.spots) - 1)
      }).catch((err) => console.error('Erro ao descontar vaga:', err));
    }

    // Fecha o modal imediatamente
    setSelectedSession(null);
    setSurferName('');
    setSurferContact('');
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newBeach || !newDate || !startTime || !endTime || !newWhatsapp) {
      alert('Por favor, preencha o pico, data, horário (De / Até) e número de WhatsApp.');
      return;
    }

    let formattedPrice = String(newPrice || '').trim();
    if (!formattedPrice || formattedPrice === '0') {
      formattedPrice = 'Gratuito (Pro Bono)';
    } else if (!isNaN(formattedPrice)) {
      formattedPrice = `${formattedPrice}€`;
    }

    const timeFormatted = `${startTime} - ${endTime}`;

    setCreateLoading(true);
    try {
      await addDoc(collection(db, 'sessions'), {
        beach: newBeach,
        date: newDate,
        time: timeFormatted,
        price: formattedPrice,
        spots: Number(newSpots) || 4,
        whatsapp: newWhatsapp,
        description: newDescription || '',
        createdAt: new Date().toISOString()
      });

      setNewBeach('');
      setNewDate('');
      setStartTime('');
      setEndTime('');
      setNewPrice('');
      setNewSpots(4);
      setNewWhatsapp('');
      setNewDescription('');
      setActiveTab('surfer');
      alert('Sessão publicada com sucesso!');
    } catch (err) {
      console.error('Erro ao publicar a sessão:', err);
      alert('Erro ao guardar a sessão. Tente novamente.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDisplayPrice = (price) => {
    if (!price) return 'Gratuito';
    const trimmed = String(price).trim();
    if (!isNaN(trimmed)) return `${trimmed}€`;
    return trimmed;
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans pb-28 selection:bg-cyan-400 selection:text-black">
      {/* Barra Superior / Header */}
      <header className="sticky top-0 z-30 bg-[#060b14]/90 backdrop-blur-md border-b border-slate-800/60 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-white">
            SurfLens
          </span>
        </div>

        <button
          onClick={() => setShowCommunityModal(true)}
          className="text-xs font-semibold px-4 py-2 rounded-full bg-[#05222c] border border-cyan-500/50 text-cyan-400 hover:bg-[#072f3d] transition active:scale-95 cursor-pointer"
        >
          Comunidade
        </button>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-6 pb-4 space-y-6">
        {activeTab === 'surfer' ? (
          <div className="space-y-6">
            <div className="text-center space-y-2 pt-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Próximas Sessões
              </h1>
              <p className="text-sm text-slate-400">
                Descubra onde estão os videógrafos e garanta o seu registo.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">A carregar sessões...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-8 text-center space-y-3">
                <div className="text-3xl">🏄‍♂️</div>
                <h3 className="text-base font-bold text-white">Sem sessões agendadas</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Ainda não existem sessões publicadas. Publique a primeira na aba "Criar Sessão".
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const hasSpots = Number(session.spots) > 0;
                  return (
                    <div
                      key={session.id}
                      className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4 transition"
                    >
                      {/* Topo do Card: Localização e Preço */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <h2 className="text-lg font-bold text-cyan-400 tracking-wide">
                            {session.beach}
                          </h2>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#152033] border border-slate-700/60 text-slate-300">
                          {formatDisplayPrice(session.price)}
                        </span>
                      </div>

                      {/* Data e Hora */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{session.time}</span>
                        </div>
                      </div>

                      {/* Notas */}
                      {session.description && (
                        <div className="bg-[#060c17] border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-400 text-center font-normal leading-relaxed">
                          {session.description}
                        </div>
                      )}

                      {/* Rodapé: Vagas e Botão Pill */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <svg className={`w-4 h-4 shrink-0 ${hasSpots ? 'text-emerald-400' : 'text-rose-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className={hasSpots ? 'text-emerald-400' : 'text-rose-400'}>
                            {hasSpots ? `${session.spots} vagas restantes` : 'Esgotado'}
                          </span>
                        </div>

                        <button
                          disabled={!hasSpots}
                          onClick={() => handleOpenReserve(session)}
                          className={`px-5 py-2 rounded-full text-xs font-bold transition active:scale-95 ${
                            hasSpots
                              ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-400/20 cursor-pointer'
                              : 'bg-[#152033] text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {hasSpots ? 'Reservar Vaga' : 'Esgotado'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VISTA: CRIAR SESSÃO */
          <div className="space-y-6">
            <div className="text-center space-y-1.5 pt-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Publicar Nova Sessão
              </h1>
              <p className="text-xs text-slate-400">
                Anuncie o pico e o horário para receber os surfistas via WhatsApp.
              </p>
            </div>

            <form
              onSubmit={handleCreateSession}
              className="bg-[#0b1322] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Praia / Pico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coxos, Carcavelos, Guincho..."
                  value={newBeach}
                  onChange={(e) => setNewBeach(e.target.value)}
                  className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              {/* Horário: "De" e "Até" */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    De *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl pl-3 pr-8 py-3 text-base text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="bg-[#0b1322] text-slate-500">
                        Início
                      </option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={`start-${time}`} value={time} className="bg-[#0b1322] text-white">
                          {time}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Até *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl pl-3 pr-8 py-3 text-base text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="bg-[#0b1322] text-slate-500">
                        Fim
                      </option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={`end-${time}`} value={time} className="bg-[#0b1322] text-white">
                          {time}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* Preço em € e Vagas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preço
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 = Grátis"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl pl-4 pr-9 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base pointer-events-none">
                      €
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Vagas Disponíveis
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={newSpots}
                    onChange={(e) => setNewSpots(e.target.value)}
                    className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contacto WhatsApp (para receber as reservas) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 912 345 678 ou +351 912..."
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Notas / Ponto de Encontro (opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Aceito pagamentos por MB Way no local."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl p-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3.5 px-4 bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-bold rounded-full text-sm transition shadow-lg shadow-cyan-400/20 disabled:opacity-50 cursor-pointer"
              >
                {createLoading ? 'A publicar...' : 'Publicar Sessão'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL DE RESERVA DIRETO AO WHATSAPP (SEM BLOQUEIOS E SEM ECRÃ INTERMÉDIO) */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1322] border border-slate-800/90 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Pedir Vaga
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedSession.beach} • {selectedSession.time}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  O seu Nome *
                </label>
                {/* 16px (text-base) impede o auto-zoom do Safari no iOS */}
                <input
                  type="text"
                  required
                  placeholder="Ex: Duarte"
                  value={surferName}
                  onChange={(e) => setSurferName(e.target.value)}
                  className="w-full bg-[#060c17] border border-cyan-400/80 rounded-2xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ex: 912000000"
                  value={surferContact}
                  onChange={(e) => setSurferContact(e.target.value)}
                  className="w-full bg-[#060c17] border border-slate-700/80 rounded-2xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                Ao carregar, abre diretamente o WhatsApp do videógrafo com a mensagem pré-preenchida para combinarem a sessão.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="w-1/3 py-3 text-xs font-semibold text-slate-400 hover:text-white rounded-full bg-[#152033] cursor-pointer"
                >
                  Cancelar
                </button>

                {/* Se o nome estiver preenchido, é um link <a> direto e nativo (nunca bloqueado por pop-ups) */}
                {surferName.trim() ? (
                 <a
                 href={getWhatsappUrl()}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={handleWhatsappClick}
                 className="w-2/3 py-3 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 rounded-full shadow-md shadow-[#25D366]/25 text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>💬</span>
                 <span>Falar no WhatsApp</span>
               </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert('Por favor, introduza o seu nome primeiro.')}
                    className="w-2/3 py-3 text-xs font-bold text-slate-500 bg-[#152033] rounded-full text-center cursor-not-allowed"
                  >
                    Falar no WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Comunidade */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1322] border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 bg-cyan-400/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto text-xl">
              🌊
            </div>
            <h3 className="text-lg font-bold text-white">Comunidade SurfLens</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ligamos surfistas a videógrafos locais para garantir registos de qualidade nas melhores sessões.
            </p>
            <button
              onClick={() => setShowCommunityModal(false)}
              className="w-full py-2.5 bg-[#152033] hover:bg-slate-700 text-white rounded-full text-xs font-semibold transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Navegação Inferior */}
      {/* BARRA INFERIOR DE NAVEGAÇÃO MINIMALISTA */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#060b14]/95 backdrop-blur-md border-t border-slate-800/70 py-2.5 px-6 flex justify-around items-center max-w-md mx-auto sm:rounded-t-3xl shadow-2xl">
        <button
          onClick={() => setActiveTab('surfer')}
          className={`flex flex-col items-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'surfer' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {/* Ícone de Ondas / Radar */}
          <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0" />
            <path d="M2 12c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0" />
            <path d="M2 18c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0" />
          </svg>
          <span className="tracking-tight">Sessões</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex flex-col items-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'create' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {/* Ícone de Câmara / Videógrafo */}
          <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 10 4.5-3v10l-4.5-3" />
            <rect width="13" height="12" x="3" y="6" rx="2.5" />
          </svg>
          <span className="tracking-tight">Criar Sessão</span>
        </button>
      </nav>
    </div>
  );
}