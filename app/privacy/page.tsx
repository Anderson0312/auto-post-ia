import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade | AutoPostIA",
  description: "Como o AutoPostIA coleta, usa e protege dados pessoais, incluindo login com TikTok e YouTube.",
  other: {
    "tiktok-developers-site-verification": "qcTfinDALEcr8ce8wvT2Dil4x9PbWsDZ",
  },
}

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "andersonmouranst@gmail.com"

export default function PoliticaDePrivacidade() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <p className="text-sm mb-6">
        <Link href="/" className="text-blue-600 underline">Início</Link>
        {" · "}
        <Link href="/terms" className="text-blue-600 underline">Termos de Serviço</Link>
      </p>
      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: 14 de agosto de 2026</p>

      <p className="mb-4">
        Esta Política descreve como o AutoPostIA trata dados pessoais quando você usa nosso site e aplicativo
        para criar vídeos curtos e conectar redes sociais. Controlador dos dados: AutoPostIA.
        Contato: <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Dados que coletamos</h2>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li><strong>Cadastro:</strong> nome, e-mail e senha (armazenada de forma criptografada).</li>
        <li>
          <strong>Login social (TikTok / YouTube / Google):</strong> identificador da plataforma (open_id ou channel id),
          nome de exibição, foto de perfil, e-mail quando a plataforma fornecer, e tokens OAuth
          (access token e refresh token) para agir em seu nome.
        </li>
        <li>
          <strong>Conteúdo do produto:</strong> prompts, roteiros, avatares, imagens, áudios, legendas e vídeos
          que você gera ou envia.
        </li>
        <li><strong>Uso técnico:</strong> logs de sessão, IP aproximado e user-agent para segurança.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Como usamos</h2>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li>Autenticar você e manter a sessão.</li>
        <li>Gerar conteúdo com provedores de IA (OpenAI, Google Gemini/Veo, Kling, entre outros).</li>
        <li>Conectar e, quando autorizado, publicar vídeos no TikTok e no YouTube Shorts.</li>
        <li>Exibir métricas básicas da conta conectada (por exemplo, número de seguidores/inscritos, se a API permitir).</li>
        <li>Cumprir obrigações legais e prevenir abuso.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Compartilhamento com terceiros</h2>
      <p className="mb-4">
        Não vendemos seus dados. Compartilhamos apenas o necessário para operar o Serviço:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li>TikTok (Login Kit e APIs de conteúdo), quando você conecta a conta TikTok.</li>
        <li>Google / YouTube, quando você conecta o canal para Shorts.</li>
        <li>Provedores de IA e armazenamento (por exemplo OpenAI, Google, Kling, Supabase, Google Cloud Storage).</li>
        <li>Autoridades, se exigido por lei.</li>
      </ul>
      <p className="mb-4">
        O uso dos dados por TikTok e Google também segue as políticas dessas empresas.
        Consulte a política de privacidade do TikTok e do Google.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Retenção</h2>
      <p className="mb-4">
        Mantemos dados da conta enquanto ela existir. Tokens OAuth são revogados quando você desconecta a rede.
        Após exclusão da conta, eliminamos ou anonimizamos dados pessoais em até 30 dias, salvo obrigação legal.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Seus direitos (LGPD)</h2>
      <p className="mb-4">
        Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pelo e-mail acima
        ou pela página de{" "}
        <Link href="/exclusao-de-dados" className="text-blue-600 underline">exclusão de dados</Link>.
        Também pode revogar o acesso OAuth nas configurações do TikTok ou da Conta Google.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Segurança</h2>
      <p className="mb-4">
        Usamos HTTPS, cookies de sessão HttpOnly e chaves de API apenas no servidor.
        Nenhum sistema é 100% seguro; notifique-nos em caso de incidente.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Crianças</h2>
      <p className="mb-4">O Serviço não se destina a menores de 13 anos (ou idade mínima exigida pelo TikTok/YouTube na sua região).</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Alterações</h2>
      <p className="mb-4">Podemos atualizar esta Política. A data no topo indica a versão vigente.</p>
    </main>
  )
}
