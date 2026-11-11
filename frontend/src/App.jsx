import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://relatorios-juda.onrender.com';

export default function App() {
  const [jovens, setJovens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('relatorio');
  const [tipoDia, setTipoDia] = useState('QUARTA');
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [presencas, setPresencas] = useState({});
  const [temaEncontro, setTemaEncontro] = useState('');
  
  const [batismoAguas, setBatismoAguas] = useState('Não');
  const [batismoEspirito, setBatismoEspirito] = useState('Não');
  const [liderAusente, setLiderAusente] = useState('Não');
  const [abordagemInterna, setAbordagemInterna] = useState('0');
  const [abordagemExterna, setAbordagemExterna] = useState('0');
  const [visitasSemana, setVisitasSemana] = useState('0');
  const [realizouEvg, setRealizouEvg] = useState('Sim');
  const [mensagensLigacoes, setMensagensLigacoes] = useState('0');
  const [jovensLimpeza, setJovensLimpeza] = useState('0');
  const [produtosLimpeza, setProdutosLimpeza] = useState('0');
  const [folhasOficio, setFolhasOficio] = useState('0');

  const [mensagemToast, setMensagemToast] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('Firme');
  const [novasNotas, setNovasNotas] = useState('');

  useEffect(() => {
    carregarJovens();
  }, []);

  const mostrarAviso = (msg) => {
    setMensagemToast(msg);
    setTimeout(() => {
      setMensagemToast('');
    }, 3000);
  };

  const carregarJovens = async () => {
    try {
      const response = await axios.get(`${API_URL}/jovens`);
      setJovens(response.data);
    } catch (error) {
      console.error('Erro ao carregar jovens:', error);
    }
  };

  const handleCadastrarJovem = async (e) => {
    e.preventDefault();
    if (!novoNome) {
      alert('Digite o nome do jovem!');
      return;
    }
    try {
      await axios.post(`${API_URL}/jovens`, {
        nome: novoNome,
        telefone: novoTelefone,
        categoria: novaCategoria,
        notas: novasNotas
      });
      setNovoNome('');
      setNovoTelefone('');
      setNovasNotas('');
      carregarJovens();
      mostrarAviso('Jovem cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar jovem:', error);
    }
  };

  const handleExcluirJovem = async (id, nome) => {
    if (window.confirm(`Deseja realmente excluir o(a) jovem ${nome}?`)) {
      try {
        await axios.delete(`${API_URL}/jovens/${id}`);
        carregarJovens();
        mostrarAviso('Jovem excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir jovem:', error);
      }
    }
  };

  const handleTogglePresenca = (jovemId, campo, valor) => {
    setPresencas((prev) => {
      const atualJovem = prev[jovemId] || {};
      if (atualJovem[campo] === valor) {
        const copiaCampo = { ...atualJovem };
        delete copiaCampo[campo];
        return { ...prev, [jovemId]: copiaCampo };
      }
      return { ...prev, [jovemId]: { ...atualJovem, [campo]: valor } };
    });
  };

  const salvarRelatorio = async () => {
    const listaPresencas = Object.entries(presencas)
      .filter(([, dados]) => Object.keys(dados).length > 0)
      .map(([jovemId, dados]) => ({
        jovem_id: parseInt(jovemId),
        status: dados.status || dados.horario || 'Presente'
      }));

    if (listaPresencas.length === 0) {
      alert('Marque pelo menos um jovem presente!');
      return;
    }

    try {
      await axios.post(`${API_URL}/relatorios`, {
        data: dataRelatorio,
        tipo_dia: tipoDia,
        presencas: listaPresencas
      });
      mostrarAviso('Relatório salvo no Banco de Dados!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
    }
  };

  const naoFirmes = jovens.filter(j => {
    const cat = (j.categoria || '').toLowerCase();
    const notas = (j.notas || '').toLowerCase();
    return cat.includes('nao') || cat.includes('não') || cat.includes('afastado') || notas.includes('afastado');
  });

  const firmes = jovens.filter(j => {
    return !naoFirmes.some(nf => nf.id === j.id);
  });

  const isObreiraEspecial = (nome) => {
    const n = (nome || '').toLowerCase();
    return n.includes('ana paula') || n.includes('mônica') || n.includes('monica');
  };

  const temMultiplosHorarios = tipoDia === 'QUARTA' || tipoDia === 'DOMINGO';

  // --- CONTAGENS SEPARADAS POR HORÁRIO (Principal vs Outro) ---
  const obreirasSelecionadasCount = firmes.filter(j => {
    if (!isObreiraEspecial(j.nome)) return false;
    const dados = presencas[j.id] || {};
    if (temMultiplosHorarios) {
      return dados.horario === 'Principal';
    }
    return Boolean(dados.status || dados.horario);
  }).length;

  const totalFirmesPrincipal = Object.entries(presencas).filter(([id, dados]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    if (!j || !firmes.some(f => f.id === j.id)) return false;
    if (isObreiraEspecial(j.nome)) return false;
    if (temMultiplosHorarios) {
      return dados.horario === 'Principal';
    }
    return Boolean(dados.status || dados.horario);
  }).length;

  const totalNovosPrincipal = Object.entries(presencas).filter(([id, dados]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    if (!j || !naoFirmes.some(nf => nf.id === j.id)) return false;
    if (dados.status !== 'Novo') return false;
    if (temMultiplosHorarios) {
      return dados.horario === 'Principal';
    }
    return true;
  }).length;

  const totalAfastadosPrincipal = Object.entries(presencas).filter(([id, dados]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    if (!j || !naoFirmes.some(nf => nf.id === j.id)) return false;
    if (dados.status !== 'Afastado') return false;
    if (temMultiplosHorarios) {
      return dados.horario === 'Principal';
    }
    return true;
  }).length;

  const totalRetornandoPrincipal = Object.entries(presencas).filter(([id, dados]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    if (!j || !naoFirmes.some(nf => nf.id === j.id)) return false;
    if (dados.status !== 'Retornando') return false;
    if (temMultiplosHorarios) {
      return dados.horario === 'Principal';
    }
    return true;
  }).length;

  const totalFirmesExtraPrincipal = Object.entries(presencas).filter(([id, dados]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    if (!j || !naoFirmes.some(nf => nf.id === j.id)) return false;
    if (dados.status !== 'Firme') return false;
    if (temMultiplosHorarios) {
      return dados.horario === 'Principal';
    }
    return true;
  }).length;

  const totalFirmesGeralPrincipal = totalFirmesPrincipal + totalFirmesExtraPrincipal;

  // Totais para a Reunião Principal
  const totalNovosGeral = totalNovosPrincipal;
  const totalAfastadosGeral = totalAfastadosPrincipal;
  const totalFirmesGeral = totalFirmesGeralPrincipal;
  const qtdObreirosTotal = obreirasSelecionadasCount;

  // Total de jovens em TODOS os horários (inclui quem foi em 'Outro')
  const totalGeralTodosHorarios = Object.entries(presencas).filter(([, dados]) => {
    return Boolean(dados.status || dados.horario);
  }).length;

  const totalRetornando = Object.entries(presencas).filter(([, dados]) => dados.status === 'Retornando').length;
  const totalTribo = totalNovosGeral + totalAfastadosGeral + totalRetornando + totalFirmesGeral + qtdObreirosTotal;

  const gerarTextoRelatorio = () => {
    if (tipoDia === 'DOMINGO') {
      return (
`🟢 *DOMINGO*
Data: ${dataRelatorio}

Tribo de Judá
🕚 Horário: 09h30 
🤍 Qt de novos: ${totalNovosGeral}
🤍 Qt de afastados: ${totalAfastadosGeral}
🤍 Qt de firmes: ${totalFirmesGeral}
🤍 Qt de Obr: ${qtdObreirosTotal}
✅ Qt total: ${totalNovosGeral + totalAfastadosGeral + totalFirmesGeral + qtdObreirosTotal}

🌐 **Qtde total o dia todo:** ${totalGeralTodosHorarios}

- Alguém se batizou nas águas? ${batismoAguas}
- Alguém foi batizado no Espírito Santo? ${batismoEspirito}
- Líder/auxiliar ausente? ${liderAusente}`
      );
    }
    if (tipoDia === 'SABADO') {
      return (
`Encontro jovem *${temaEncontro || 'tema'}*: 

🔻 *Tribo de Judá* 

▫️ *Novos:* ${totalNovosGeral}
▫️ *Afastados:* ${totalAfastadosGeral}
▫️ *Retornando:* ${totalRetornando}
▫️ *Firmes:* ${totalFirmesGeral}
▫️ *Obreiros:* ${qtdObreirosTotal}
▫️ *Ab. Interna:* ${abordagemInterna}
▫️ *Ab. Externa:* ${abordagemExterna}
▫️ *Total da tribo:* ${totalGeralTodosHorarios}

🔰 *Visitas da semana:* ${visitasSemana}
🗣️ *A tribo realizou evg?* ${realizouEvg}
📲 *Qt. de mensagens/ligações:* ${mensagensLigacoes}
🪣 *Qt. de jovens na limpeza:* ${jovensLimpeza}
🧹 *Qt. de produtos de limpeza trazidos na semana:* ${produtosLimpeza}
🎞️ *Qt. de folhas ofício trazidas na semana:* ${folhasOficio}`
      );
    }
    if (tipoDia === 'QUARTA') {
      return (
`QUARTA-FEIRA / Escola da fé 🤓🙏🏽
Data: ${dataRelatorio}

Tribo de Judá
Líder: Mônica
Auxiliar: Erick

Qt de jovens na reunião das 19h
- Jovens novos: ${totalNovosGeral}
- Jovens Afastados: ${totalAfastadosGeral}
- Jovens firmes: ${totalFirmesGeral}
Total: ${totalNovosGeral + totalAfastadosGeral + totalFirmesGeral}
Total de jovens em todos os horários: ${totalGeralTodosHorarios}`
      );
    }
    if (tipoDia === 'SEGUNDA') {
      return (
`ALGO A MAIS 

🗓️ Data: ${dataRelatorio}

📍 Tribo de Judá
📍 Líder: Mônica 

📍 Qt. total: ${totalGeralTodosHorarios}

- Qt. de novos: ${totalNovosGeral}
- Qt. de afastados: ${totalAfastadosGeral}
- Qt. de firmes: ${totalFirmesGeral}`
      );
    }
  };

  const copiarRelatorio = () => {
    const texto = gerarTextoRelatorio();
    navigator.clipboard.writeText(texto).then(() => {
      mostrarAviso('Relatório copiado! Pronto para o WhatsApp.');
    }).catch(err => console.error('Erro ao copiar:', err));
  };

  return (
    <div className="notranslate" translate="no" style={{ padding: '15px', maxWidth: '850px', margin: '0 auto' }}>
      {mensagemToast && (
        <div className="toast-notification">
          {mensagemToast}
        </div>
      )}

      <header style={{ textAlign: 'center' }}>
        <h1>TRIBO DE JUDÁ</h1>
        <p style={{ color: '#d4a338', fontFamily: 'Cinzel, serif', letterSpacing: '2px', marginTop: 0 }}>
          SISTEMA DE RELATÓRIOS FJU
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', gap: '15px' }}>
        <button 
          onClick={() => setAbaAtiva('relatorio')} 
          className={`tab-button ${abaAtiva === 'relatorio' ? 'active' : ''}`}
        >
          Check-list Diário
        </button>
        <button 
          onClick={() => setAbaAtiva('jovens')} 
          className={`tab-button ${abaAtiva === 'jovens' ? 'active' : ''}`}
        >
          Gerenciar Jovens
        </button>
      </div>

      {abaAtiva === 'relatorio' ? (
        <div className="main-card">
          <h2>Relatório do Dia</h2>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#e2b044' }}><strong>Data:</strong></label>
              <input type="date" value={dataRelatorio} onChange={(e) => setDataRelatorio(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#e2b044' }}><strong>Reunião:</strong></label>
              <select value={tipoDia} onChange={(e) => setTipoDia(e.target.value)}>
                <option value="SEGUNDA">Segunda-feira (Algo a Mais)</option>
                <option value="QUARTA">Quarta-feira (Escola da Fé)</option>
                <option value="SABADO">Sábado (Encontro Jovem)</option>
                <option value="DOMINGO">Domingo (Reunião)</option>
              </select>
            </div>
          </div>

          {(tipoDia === 'SABADO' || tipoDia === 'DOMINGO') && (
            <div style={{ background: 'rgba(11, 34, 23, 0.9)', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #b8861e' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#e2b044' }}>Informações Especiais:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {tipoDia === 'SABADO' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Tema do Encontro Jovem:</label>
                    <input type="text" value={temaEncontro} onChange={(e) => setTemaEncontro(e.target.value)} placeholder="Ex: A Escolha Certa" style={{ width: '100%' }} />
                  </div>
                )}
                {tipoDia === 'SABADO' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Abordagem Interna:</label>
                      <input type="number" value={abordagemInterna} onChange={(e) => setAbordagemInterna(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Abordagem Externa:</label>
                      <input type="number" value={abordagemExterna} onChange={(e) => setAbordagemExterna(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Visitas da Semana:</label>
                      <input type="number" value={visitasSemana} onChange={(e) => setVisitasSemana(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Mensagens / Ligações:</label>
                      <input type="number" value={mensagensLigacoes} onChange={(e) => setMensagensLigacoes(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Jovens na Limpeza:</label>
                      <input type="number" value={jovensLimpeza} onChange={(e) => setJovensLimpeza(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Produtos de Limpeza:</label>
                      <input type="number" value={produtosLimpeza} onChange={(e) => setProdutosLimpeza(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Folhas de Ofício:</label>
                      <input type="number" value={folhasOficio} onChange={(e) => setFolhasOficio(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Realizou EVG?</label>
                      <select value={realizouEvg} onChange={(e) => setRealizouEvg(e.target.value)} style={{ width: '100%' }}>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                  </>
                )}
                {tipoDia === 'DOMINGO' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Batismo nas Águas?</label>
                      <select value={batismoAguas} onChange={(e) => setBatismoAguas(e.target.value)} style={{ width: '100%' }}>
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Batismo no Espírito Santo?</label>
                      <select value={batismoEspirito} onChange={(e) => setBatismoEspirito(e.target.value)} style={{ width: '100%' }}>
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Líder/Auxiliar Ausente?</label>
                      <select value={liderAusente} onChange={(e) => setLiderAusente(e.target.value)} style={{ width: '100%' }}>
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <h3>Jovens Firmes ({firmes.length})</h3>
          <div className="grid-firmes">
            {firmes.map((j) => {
              const dadosJovem = presencas[j.id] || {};
              return (
                <div key={j.id}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#e2b044', display: 'block' }}>{j.nome}</strong>
                    <small style={{ color: '#a0aec0', display: 'block', fontSize: '0.75rem' }}>{j.notas || j.categoria}</small>
                  </div>
                  {temMultiplosHorarios ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', width: '100%' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={dadosJovem.horario === 'Principal'}
                          onChange={() => handleTogglePresenca(j.id, 'horario', 'Principal')}
                        />
                        Reunião Principal
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={dadosJovem.horario === 'Outro'}
                          onChange={() => handleTogglePresenca(j.id, 'horario', 'Outro')}
                        />
                        Outro
                      </label>
                    </div>
                  ) : (
                    <label style={{ marginTop: '6px' }}>
                      <input
                        type="checkbox"
                        checked={dadosJovem.status === 'Presente'}
                        onChange={() => handleTogglePresenca(j.id, 'status', 'Presente')}
                      />
                      Presente
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <h3>Não Firmes ({naoFirmes.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
            {naoFirmes.map((j) => {
              const dadosJovem = presencas[j.id] || {};
              const statusAtual = dadosJovem.status;
              const estaSelecionado = Boolean(statusAtual);
              return (
                <div key={j.id} style={{ background: '#112c1f', padding: '12px', borderRadius: '6px', border: '1px solid #1e4a35', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span>
                      <strong style={{ fontSize: '1.1rem', color: '#e2b044' }}>{j.nome}</strong>
                      <small style={{ color: '#a0aec0', marginLeft: '8px' }}>({j.categoria})</small>
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleTogglePresenca(j.id, 'status', 'Afastado')}
                        className={`btn-status ${statusAtual === 'Afastado' ? 'btn-status-afastado' : 'btn-status-inactive'}`}
                      >
                        {statusAtual === 'Afastado' ? '[X] Afastado' : 'Afastado'}
                      </button>
                      <button
                        onClick={() => handleTogglePresenca(j.id, 'status', 'Novo')}
                        className={`btn-status ${statusAtual === 'Novo' ? 'btn-status-retornando' : 'btn-status-inactive'}`}
                      >
                        {statusAtual === 'Novo' ? '[X] Novo' : 'Novo'}
                      </button>
                      <button
                        onClick={() => handleTogglePresenca(j.id, 'status', 'Firme')}
                        className={`btn-status ${statusAtual === 'Firme' ? '' : 'btn-status-inactive'}`}
                        style={statusAtual === 'Firme' ? { background: '#f3c660', color: '#07160f' } : {}}
                      >
                        {statusAtual === 'Firme' ? '[X] Firme' : 'Firme'}
                      </button>
                      {tipoDia === 'SABADO' && (
                        <button
                          onClick={() => handleTogglePresenca(j.id, 'status', 'Retornando')}
                          className={`btn-status ${statusAtual === 'Retornando' ? 'btn-status-retornando' : 'btn-status-inactive'}`}
                        >
                          {statusAtual === 'Retornando' ? '[X] Retornando' : 'Retornando'}
                        </button>
                      )}
                    </div>
                  </div>
                  {temMultiplosHorarios && estaSelecionado && (
                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={dadosJovem.horario === 'Principal'}
                          onChange={() => handleTogglePresenca(j.id, 'horario', 'Principal')}
                          style={{ width: '16px', height: '16px', accentColor: '#d4a338' }}
                        />
                        Reunião Principal
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={dadosJovem.horario === 'Outro'}
                          onChange={() => handleTogglePresenca(j.id, 'horario', 'Outro')}
                          style={{ width: '16px', height: '16px', accentColor: '#d4a338' }}
                        />
                        Outro
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <hr style={{ borderColor: '#b8861e', margin: '30px 0', opacity: 0.4 }} />

          <div style={{ background: '#07160f', padding: '20px', borderRadius: '18px', border: '1px solid #c89528' }}>
            <h3 style={{ marginTop: 0 }}>Relatório Pronto:</h3>
            <pre className="whatsapp-box" style={{ whiteSpace: 'pre-wrap' }}>
              {gerarTextoRelatorio()}
            </pre>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
              <button onClick={copiarRelatorio} className="tab-button active" style={{ flex: 1, padding: '14px', fontSize: '1rem' }}>
                Copiar Relatório
              </button>
              <button onClick={salvarRelatorio} style={{ flex: 1, padding: '14px', fontSize: '1rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Cinzel, serif' }}>
                Salvar no Banco
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="main-card">
          <h2>Cadastrar Novo Jovem</h2>
          <form onSubmit={handleCadastrarJovem} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '450px', marginBottom: '30px' }}>
            <input
              type="text"
              placeholder="Nome Completo"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Telefone (WhatsApp)"
              value={novoTelefone}
              onChange={(e) => setNovoTelefone(e.target.value)}
            />
            <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)}>
              <option value="Firme">Firme</option>
              <option value="Nao Firme">Não Firme (Afastado/Retornando)</option>
              <option value="Novo">Novo (Primeira vez)</option>
            </select>
            <textarea
              placeholder="Observações sobre o jovem..."
              value={novasNotas}
              onChange={(e) => setNovasNotas(e.target.value)}
              rows="3"
            />
            <button type="submit" className="tab-button active" style={{ padding: '10px' }}>
              Adicionar Jovem
            </button>
          </form>

          <h3>Lista de Jovens Cadastrados ({jovens.length})</h3>
          <ul style={{ paddingLeft: '20px', color: '#e2e8f0' }}>
            {jovens.map((j) => (
              <li key={j.id} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#112c1f', padding: '8px 12px', borderRadius: '6px', border: '1px solid #1e4a35' }}>
                <span>
                  <strong style={{ color: '#e2b044' }}>{j.nome}</strong> 
                  <em> ({j.categoria})</em> {j.telefone ? `- ${j.telefone}` : ''} 
                  {j.notas ? ` - Obs: ${j.notas}` : ''}
                </span>
                <button
                  onClick={() => handleExcluirJovem(j.id, j.nome)}
                  style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}