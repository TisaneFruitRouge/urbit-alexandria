# SSH host for your live ship
SSH_HOST ?= hidrel
# Path to the pier on the remote server
PIER     ?= ~/hidrel
# Urbit web login code (from +code in dojo). Store in .urbit-code or pass inline:
#   make commit CODE=lidlut-...
CODE     ?= $(shell cat .urbit-code 2>/dev/null)
COMMIT_JSON := {"source":{"as":{"mark":"kiln-commit","next":{"dojo":"[%alexandria |]"}}},"sink":{"app":"hood"}}

DESK_SOURCES := app/alexandria.hoon lib/alexandria.hoon sur/alexandria.hoon \
                mar/alexandria desk.bill

# ── Local dev sync ────────────────────────────────────────────────────────────

.PHONY: sync-zod sync-bus sync

sync-zod:
	mkdir -p zod/alexandria/app zod/alexandria/lib zod/alexandria/sur \
	         zod/alexandria/mar/alexandria
	cp app/alexandria.hoon    zod/alexandria/app/
	cp lib/alexandria.hoon    zod/alexandria/lib/
	cp sur/alexandria.hoon    zod/alexandria/sur/
	cp mar/alexandria/*.hoon  zod/alexandria/mar/alexandria/
	cp desk.bill desk.docket-0 sys.kelvin  zod/alexandria/

sync-bus:
	mkdir -p bus/alexandria/app bus/alexandria/lib bus/alexandria/sur \
	         bus/alexandria/mar/alexandria
	cp app/alexandria.hoon    bus/alexandria/app/
	cp lib/alexandria.hoon    bus/alexandria/lib/
	cp sur/alexandria.hoon    bus/alexandria/sur/
	cp mar/alexandria/*.hoon  bus/alexandria/mar/alexandria/
	cp desk.bill desk.docket-0 sys.kelvin  bus/alexandria/

sync: sync-zod sync-bus

# ── Frontend ──────────────────────────────────────────────────────────────────

.PHONY: build glob

build:
	cd web && yarn build

# Build the Landscape glob payload. Upload web/dist with /docket/upload.
glob: build
	cd web/dist && zip -r ../glob.zip .

# ── Remote deployment ─────────────────────────────────────────────────────────

.PHONY: deploy deploy-initial commit

# Sync all desk files to the live ship, then prompt to commit.
deploy:
	ssh $(SSH_HOST) "mkdir -p $(PIER)/alexandria/app $(PIER)/alexandria/lib $(PIER)/alexandria/sur $(PIER)/alexandria/mar/alexandria"
	rsync -av app/  $(SSH_HOST):$(PIER)/alexandria/app/
	rsync -av lib/  $(SSH_HOST):$(PIER)/alexandria/lib/
	rsync -av sur/  $(SSH_HOST):$(PIER)/alexandria/sur/
	rsync -av mar/alexandria/ $(SSH_HOST):$(PIER)/alexandria/mar/alexandria/
	rsync -av desk.bill sys.kelvin $(SSH_HOST):$(PIER)/alexandria/
	@echo ""
	@echo "Files synced to ~hidrel. Run: make commit"
	@echo "(desk.docket-0 is NOT pushed — it holds the glob hash set by the globulator)"

# First-time desk sync only. Do not use after Globulator has written the real
# glob hash into desk.docket-0 on the ship.
deploy-initial: deploy
	rsync -av desk.docket-0 $(SSH_HOST):$(PIER)/alexandria/
	@echo ""
	@echo "Initial docket synced. Run: make commit, then |install our %alexandria."

# Poke the ship to |commit %alexandria via its HTTP API.
# Reads the login code from .urbit-code or CODE= env var.
commit:
	@test -n "$(CODE)" || \
		(echo "ERROR: no code found. Run '+code' in dojo, then either:"; \
		 echo "  echo 'lidlut-...' > .urbit-code"; \
		 echo "  make commit CODE=lidlut-..."; \
		 exit 1)
	@ssh $(SSH_HOST) ' \
		read -r code; \
		curl -fsS -c /tmp/urbit-jar \
		     -X POST http://127.0.0.1:12321/~/login \
		     -d "password=$$code" > /dev/null && \
		curl -fsS -b /tmp/urbit-jar \
		     -X POST http://127.0.0.1:12321/~/channel/makefile-commit-$$$$ \
		     -H "Content-Type: application/json" \
		     -d '"'"'$(COMMIT_JSON)'"'"' && \
		echo "committed %alexandria on ~hidrel" \
	' < .urbit-code

# Build frontend, sync desk files, and commit in one shot.
push: deploy commit
