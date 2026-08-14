import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Serviço | AutoPostIA",
  description: "Termos de Serviço da plataforma AutoPostIA para criação de vídeos curtos com IA.",
  other: {
    "tiktok-developers-site-verification": "NQDuqNXYGHwgz6lylzY5khdlaR8yDeUU",
  },
}

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "andersonmouranst@gmail.com"

export default function TermosDeServico() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4 prose prose-slate">
      <p className="text-sm">
        <Link href="/" className="text-blue-600 underline">Início</Link>
        {" · "}
        <Link href="/privacy" className="text-blue-600 underline">Política de Privacidade</Link>
      </p>
      <h1 className="text-3xl font-bold mb-2">Termos de Serviço</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: 14 de agosto de 2026</p>

      <p>
        Estes Termos de Serviço (“Termos”) regem o uso da plataforma AutoPostIA (“Serviço”, “nós”),
        um software para criação de vídeos curtos com inteligência artificial e conexão com redes sociais
        (incluindo TikTok e YouTube Shorts). Ao criar uma conta ou usar o Serviço, você concorda com estes Termos.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Conta e elegibilidade</h2>
      <p>
        Você deve ter idade legal para contratar no seu país e fornecer informações verdadeiras.
        Você é responsável por manter a confidencialidade da conta e por toda atividade nela realizada.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. O que o Serviço faz</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Gerar roteiros, imagens, narração, legendas e vídeos curtos com provedores de IA.</li>
        <li>Manter avatares virtuais e projetos de conteúdo.</li>
        <li>Conectar contas de redes sociais via OAuth (TikTok, YouTube, Instagram e outras).</li>
        <li>Publicar ou auxiliar a publicação de conteúdo nas plataformas conectadas, quando essa função estiver disponível.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Login com TikTok e YouTube</h2>
      <p>
        Ao conectar TikTok ou YouTube, você autoriza o AutoPostIA a obter identificadores de perfil,
        dados básicos da conta/canal e permissões de publicação conforme os escopos que você aprovar
        na tela de consentimento da respectiva plataforma. Você pode revogar o acesso a qualquer momento
        nas configurações do TikTok, do Google/YouTube ou em Dashboard → Redes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Conteúdo gerado e responsabilidade</h2>
      <p>
        Você é o único responsável pelo conteúdo criado, publicado ou enviado (textos, imagens, vídeos, áudios).
        É proibido usar o Serviço para conteúdo ilegal, enganoso, que viole direitos autorais, marcas,
        privacidade, políticas do TikTok, YouTube ou outras redes, ou que explore menores.
        Conteúdo gerado por IA pode conter imprecisões; revise antes de publicar.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Propriedade intelectual</h2>
      <p>
        O software, marca e interface do AutoPostIA pertencem a nós. O conteúdo que você cria permanece seu,
        observado os termos dos provedores de IA e das redes sociais. Você nos concede licença limitada para
        processar esse conteúdo apenas para operar o Serviço.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Créditos de IA e disponibilidade</h2>
      <p>
        Geração de vídeo e imagem depende de APIs de terceiros (por exemplo Kling e Google).
        Saldo, cotas e indisponibilidade desses provedores estão fora do nosso controle.
        O Serviço é oferecido “como está”, sem garantia de resultados de engajamento ou viralização.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Encerramento</h2>
      <p>
        Você pode encerrar a conta a qualquer momento. Podemos suspender ou encerrar o acesso em caso de
        violação destes Termos ou das políticas das plataformas conectadas.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Limitação de responsabilidade</h2>
      <p>
        Na máxima medida permitida pela lei, não respondemos por lucros cessantes, perda de dados,
        bloqueio de contas em redes sociais ou danos indiretos decorrentes do uso do Serviço.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">9. Alterações</h2>
      <p>Podemos atualizar estes Termos. O uso continuado após a publicação constitui aceite da versão vigente.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">10. Contato</h2>
      <p>
        Dúvidas:{" "}
        <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
        . Exclusão de dados:{" "}
        <Link href="/exclusao-de-dados" className="text-blue-600 underline">instruções de exclusão</Link>.
      </p>
    </main>
  )
}
