.PHONY: build build_relay run_relay run_validator_server run_standalone build_and_run_standalone clean clean_ir generate_ir clean_and_generate_ir

# build standalone, validator server, and relay server.
build: build_relay
	@bash scripts/build.sh

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
