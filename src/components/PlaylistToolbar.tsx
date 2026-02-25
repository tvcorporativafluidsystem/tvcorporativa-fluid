import Button from './ui/Button'
import { setTransmissao } from '../services/transmissaoService'

export default function PlaylistToolbar({
  transmitindo,
  onReload
}: {
  transmitindo: boolean
  onReload: () => void
}) {
  async function handleTransmit(status: boolean) {
    await setTransmissao(status)
    await onReload()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!transmitindo ? (
        <Button variant="primary" onClick={() => handleTransmit(true)}>TRANSMITIR PARA TV</Button>
      ) : (
        <Button variant="danger" onClick={() => handleTransmit(false)}>PARAR TRANSMISSÃO</Button>
      )}
      <Button variant="secondary" onClick={onReload}>Atualizar</Button>
    </div>
  )
}
