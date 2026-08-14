import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-xl font-semibold">
            AutoPost<span className="text-fuchsia-400">IA</span>
          </span>
          <div className="flex gap-2">
            <Link href="/login" className="px-3 py-2 text-sm text-zinc-400">
              Entrar
            </Link>
            <Link href="/register">
              <Button className="bg-fuchsia-500 hover:bg-fuchsia-400">Começar</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-sm text-fuchsia-400">Estúdio de crescimento para shorts</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
          Cresça no TikTok, Shorts e Reels sem começar do zero
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-zinc-400">
          Objetivo padrão: engajamento. Cole um canal, pegue um trend ou uma ideia — a IA gera um short 9:16 com o seu avatar.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register">
            <Button size="lg" className="bg-fuchsia-500 hover:bg-fuchsia-400">
              Criar conta
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Entrar no estúdio
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 md:grid-cols-3">
        {[
          { t: "Novo short", d: "Uma ideia. Cinco ângulos virais. Roteiro e vídeo 9:16." },
          { t: "Copiar canal", d: "Formato, hook e estrutura. Nunca o vídeo original." },
          { t: "Em alta", d: "O que o mundo está assistindo, virado no seu estilo." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-zinc-800 p-6">
            <h2 className="font-medium">{c.t}</h2>
            <p className="mt-2 text-sm text-zinc-400">{c.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        <Link href="/terms" className="px-2">
          Termos
        </Link>
        <Link href="/privacy" className="px-2">
          Privacidade
        </Link>
        <Link href="/exclusao-de-dados" className="px-2">
          Exclusão de dados
        </Link>
        <p className="mt-3">© 2026 AutoPostIA</p>
      </footer>
    </div>
  )
}
