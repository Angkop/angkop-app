#!/bin/bash

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

PROTECTED_BRANCHES="main"

block() {
  echo "BLOCKED: '$COMMAND' $1 The user has prevented you from doing this." >&2
  exit 2
}

# Hard-blocked dangerous patterns
DANGEROUS_PATTERNS=(
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    block "matches dangerous pattern '$pattern'."
  fi
done

# Push handling: block force pushes and direct pushes to main
if echo "$COMMAND" | grep -qE "git push"; then
  # Block force pushes outright
  if echo "$COMMAND" | grep -qE "(--force|--force-with-lease|[[:space:]]-f([[:space:]]|$))"; then
    block "is a force push, which is not allowed."
  fi

  # Block explicit push to main
  for branch in $PROTECTED_BRANCHES; do
    if echo "$COMMAND" | grep -qE "(^|[[:space:]])(origin[[:space:]]+|[^[:space:]]*:)${branch}([[:space:]]|$)"; then
      block "pushes directly to protected branch '$branch'. Open a PR instead."
    fi
  done

  # Block bare 'git push' when on a protected branch
  if ! echo "$COMMAND" | grep -qE "git push[[:space:]]+[^[:space:]]+[[:space:]]+[^[:space:]]"; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    for branch in $PROTECTED_BRANCHES; do
      if [ "$CURRENT_BRANCH" = "$branch" ]; then
        block "is a bare push from protected branch '$branch'. Open a PR instead."
      fi
    done
  fi
fi

exit 0
