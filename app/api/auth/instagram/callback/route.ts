export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  // Troque o code pelo access_token usando a API do Instagram
  // Salve o access_token no banco de dados
  // Redirecione para o frontend com status de sucesso
}
