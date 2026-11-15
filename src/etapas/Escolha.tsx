import { tocar } from '../som/som'
import { Correcao, Fala, Seguir, type PropsEtapa } from './comum'

/** Diagnóstico na prancheta do prontuário ou pergunta da preceptora: vale a primeira resposta. */
export function Escolha({ etapa, resposta, responder, seguir }: PropsEtapa<'escolha'>) {
  const escolhida = resposta && etapa.opcoes[resposta.opcao]
  const certa = etapa.opcoes.find((o) => o.correta)!

  return (
    <>
      {etapa.quem === 'preceptora' ? (
        <Fala quem="Preceptora">{etapa.pergunta}</Fala>
      ) : (
        <section className="caixa">
          <span className="rotulo">{etapa.titulo}</span>
          <h2>{etapa.pergunta}</h2>
        </section>
      )}
      <div className="opcoes">
        {etapa.opcoes.map((o, i) => (
          <button
            key={o.texto}
            type="button"
            disabled={!!resposta}
            aria-pressed={o === escolhida}
            className={resposta && o.correta ? 'certa' : o === escolhida ? 'errada' : undefined}
            onClick={() => {
              responder({ tipo: 'escolha', opcao: i })
              tocar(o.correta ? 'acerto' : 'erro')
            }}
          >
            {resposta && o.correta ? '✓ ' : o === escolhida ? '✗ ' : ''}
            {o.texto}
          </button>
        ))}
      </div>
      {escolhida && (
        <>
          <Correcao certo={escolhida.correta}>
            <p>{escolhida.explicacao}</p>
            {!escolhida.correta && (
              <p>
                <strong>Resposta certa: {certa.texto}.</strong> {certa.explicacao}
              </p>
            )}
          </Correcao>
          <Seguir seguir={seguir} />
        </>
      )}
    </>
  )
}
