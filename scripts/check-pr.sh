#!/usr/bin/env bash
# Regras de Gitflow, Conventional Commits e de nenhuma atribuição a IA num pull request.
# O CI passa HEAD_REF, BASE_REF, TITLE, BODY, BASE_SHA e HEAD_SHA como variáveis de ambiente.
set -euo pipefail
fail=0
err() {
	echo "::error::$1"
	fail=1
}

# Gitflow: qual branch pode entrar em qual
semver='[0-9]+\.[0-9]+\.[0-9]+'
case "$BASE_REF" in
develop) allowed="^(feature/[a-z0-9]+(-[a-z0-9]+)*|main|dependabot/.+)$" ;;
main) allowed="^(release|hotfix)/$semver$" ;;
*) allowed='^$' ;;
esac
if ! [[ $HEAD_REF =~ $allowed ]]; then
	err "Gitflow: '$HEAD_REF' não pode entrar na '$BASE_REF'. Permitido: feature/<nome-em-kebab>, main ou dependabot/* na develop; release/x.y.z ou hotfix/x.y.z na main (o auto-merge traz a main de volta para a develop)."
fi

# Conventional Commits: título do PR e assunto de cada commit
cc='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .+'
if ! [[ $TITLE =~ $cc ]]; then
	err "O título do PR não segue Conventional Commits: '$TITLE'"
fi
while IFS= read -r subject; do
	if ! [[ $subject =~ $cc ]]; then
		err "Commit fora de Conventional Commits: '$subject'"
	fi
done < <(git log --no-merges --format=%s "$BASE_SHA..$HEAD_SHA")

# Nenhuma atribuição a IA: título e corpo do PR, mensagens, autores e committers dos commits
attribution='co-authored-by:.*(claude|anthropic)|generated with.*claude|noreply@anthropic\.com|claude\.ai/code|claude-session|^(author|committer): .*(claude|anthropic)'
found=$(
	{
		printf '%s\n%s\n' "$TITLE" "$BODY"
		git log --format='%B%nauthor: %an <%ae>%ncommitter: %cn <%ce>' "$BASE_SHA..$HEAD_SHA"
	} | grep -i -E "$attribution" || true
)
if [ -n "$found" ]; then
	echo "$found"
	err "Atribuição a IA encontrada (linhas acima). Tire do texto do PR e dos commits."
fi

exit "$fail"
