mkdir -p diagnostics

LOG="diagnostics/orivyn-diagnostics-$(date +%Y%m%d-%H%M%S).log"

(
    set +e
export CI=1
export FORCE_COLOR=0
export NO_COLOR=1

echo "========================================"
echo "ORIVYN FULL DIAGNOSTICS"
echo "Date: $(date)"
echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "Git commit: $(git rev-parse HEAD)"
echo "========================================"

run_check() {
    echo
    echo "========================================"
    echo "START: $1"
    echo "========================================"

    shift
    "$@"
    result=$?

        echo
        echo "RESULT: $result"
    echo "========================================"
}

run_check "FORMAT" pnpm exec biome format .
    run_check "LINT / BIOME" pnpm check
run_check "TYPESCRIPT" pnpm typecheck
run_check "ALL TESTS" pnpm test
run_check "ALL BUILDS" pnpm build

run_check "PYTHON RUFF LINT" uv run --project apps/api ruff check apps/api
run_check "PYTHON RUFF FORMAT" uv run --project apps/api ruff format --check apps/api
run_check "PYTHON PYTEST" uv run --project apps/api pytest apps/api/tests

echo
echo "========================================"
echo "DIAGNOSTICS COMPLETE"
echo "========================================"

) > "$LOG" 2>&1

echo "Diagnostics saved to: $LOG"