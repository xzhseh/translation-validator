.PHONY: build build_alive2 build_relay run_relay run_validator_server run_standalone build_and_run_standalone clean clean_ir generate_ir clean_and_generate_ir

# build standalone, validator server, and relay server.
# note: this will NOT build alive2 for quick development.
build: build_relay
	@bash scripts/build.sh

# a complete full build that builds alive2, standalone, validator server, and relay server.
# note: this may takes a while to complete.
full_build: build_alive2 build_relay
	@bash scripts/build.sh

build_alive2:
	@bash scripts/build_alive2_snapshot.sh

build_relay:
	@bash scripts/build_relay.sh

run_relay:
	@./relay_server/build/relay_server

run_validator_server:
	@./build/validator_server

run_standalone:
	@./build/standalone $(filter-out $@ build_and_run_standalone, $(MAKECMDGOALS)) $(ARGS)

build_and_run_standalone: build run_standalone

generate_ir:
	@python3 scripts/src2ir.py

clean_ir:
	@rm examples/ir/*/*.ll

clean_and_generate_ir: clean_ir generate_ir

clean:
	@rm -rf build

# special target to prevent make from treating arguments as targets
%:
	@:
