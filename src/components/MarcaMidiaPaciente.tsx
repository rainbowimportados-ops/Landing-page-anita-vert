import './marca-midia-paciente.css'

/** Assinatura visual do site; os arquivos clínicos não são alterados. */
export function MarcaMidiaPaciente({ miniatura = false }: { miniatura?: boolean }) {
  return <span className={`midia-paciente__marca${miniatura ? ' midia-paciente__marca--mini' : ''}`} aria-hidden="true" />
}

export function CreditosMidiaPaciente({ className = '' }: { className?: string }) {
  return (
    <p className={`midia-paciente__creditos ${className}`}>
      © 2026 Instituto Vert. Todos os direitos reservados. · CLÍNICA DRA ANITA MATIAS DE ALMEIDA LTDA · CNPJ 37.669.064/0001-90 · Responsável técnica: Dra. Anita Matias de Almeida — CRO-SP 132978
    </p>
  )
}
