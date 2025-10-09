import React from "react";

export default function ExclusaoDeDados() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "andersonmouranst@gmail.com";

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Exclusão de Dados (Data Deletion Instructions)</h1>
      <p className="mb-4">
        Esta página descreve como você pode solicitar a exclusão dos seus dados
        associados ao uso do nosso aplicativo, em conformidade com as políticas
        da Meta (Facebook/Instagram) e legislação aplicável.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Opções de exclusão</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Remover a conexão com a rede social em <span className="font-medium">Dashboard &gt; Contas de Redes Sociais</span>.
          Isso revoga tokens de acesso e desconecta seu perfil daquela rede.
        </li>
        <li>
          Nas configurações da Meta: você pode revogar o acesso do aplicativo em
          <span className="font-medium"> Configurações do Facebook &gt; Apps e sites</span> ou
          <span className="font-medium"> Configurações do Instagram</span>.
        </li>
        <li>
          Solicitar exclusão total dos dados da sua conta (inclui perfil, agendamentos,
          configurações de IA e tokens de redes sociais) seguindo as instruções abaixo.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Como solicitar a exclusão total</h2>
      <p className="mb-3">Envie um e-mail para nossa equipe com o assunto "Exclusão de Dados" contendo:</p>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li>Seu nome completo e e-mail usado no cadastro.</li>
        <li>Quais redes sociais estão conectadas (Facebook, Instagram, LinkedIn, Twitter).</li>
        <li>(Opcional) Seu ID da rede social, se desejar agilizar a identificação.</li>
      </ul>
      <p className="mb-4">
        E-mail para solicitação: <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Prazo e processo</h2>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li>Revogação de tokens de redes sociais: até 72 horas após a solicitação.</li>
        <li>Exclusão completa de dados da conta: até 30 dias corridos.</li>
        <li>Você receberá confirmação por e-mail quando concluirmos a exclusão.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Dúvidas</h2>
      <p>
        Caso tenha dúvidas, entre em contato pelo e-mail acima. Estamos à disposição para
        apoiar no processo de exclusão e esclarecimentos adicionais.
      </p>
    </main>
  );
}