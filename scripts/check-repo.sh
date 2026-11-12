#!/usr/bin/env bash
# Regras do projeto que o oxlint, o TypeScript e os testes não checam. Rode na raiz: bash scripts/check-repo.sh
set -euo pipefail
fail=0

# Nada que o .gitignore cobre pode estar no Git (pega um git add -f de documentação interna, .env, chaves ou build)
ignored=$(git ls-files -ci --exclude-standard)
if [ -n "$ignored" ]; then
	echo "$ignored"
	echo "::error::estes arquivos estão no Git mas batem com o .gitignore e precisam sair (git rm --cached)"
	fail=1
fi

exit "$fail"
