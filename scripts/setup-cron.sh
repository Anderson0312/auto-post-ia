#!/bin/bash

# Script para configurar cron job para automação de posts
# Execute como: bash scripts/setup-cron.sh

echo "Configurando cron job para automação de posts..."

# Obter o diretório atual do projeto
PROJECT_DIR=$(pwd)
SCRIPT_PATH="$PROJECT_DIR/scripts/run-automation.js"

# Verificar se o script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Erro: Script de automação não encontrado em $SCRIPT_PATH"
    exit 1
fi

# Tornar o script executável
chmod +x "$SCRIPT_PATH"

# Adicionar entrada ao crontab
# Executa a cada hora (0 minutos de cada hora)
CRON_ENTRY="0 * * * * cd $PROJECT_DIR && node scripts/run-automation.js >> logs/automation.log 2>&1"

# Verificar se já existe uma entrada similar
if crontab -l 2>/dev/null | grep -q "run-automation.js"; then
    echo "Cron job já existe. Removendo entrada antiga..."
    crontab -l 2>/dev/null | grep -v "run-automation.js" | crontab -
fi

# Adicionar nova entrada
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "Cron job configurado com sucesso!"
echo "A automação será executada a cada hora."
echo ""
echo "Para verificar o cron job:"
echo "crontab -l"
echo ""
echo "Para ver os logs:"
echo "tail -f logs/automation.log"
echo ""
echo "Para remover o cron job:"
echo "crontab -l | grep -v 'run-automation.js' | crontab -"

# Criar diretório de logs se não existir
mkdir -p logs

echo "Diretório de logs criado: logs/"
