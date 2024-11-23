.PHONY: build run build_and_run clean clean_ir generate_ir clean_and_generate_ir

build:
	@bash scripts/build.sh

build_relay:
	@bash scripts/build_relay.sh

run_relay:
	@./relay_server/build/relay_server

run:
	@./build/translation_validator $(filter-out $@ build_and_run, $(MAKECMDGOALS)) $(ARGS)

build_and_run: build run

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
