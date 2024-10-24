.PHONY: build run build_and_run clean

build:
	bash scripts/build.sh

run:
	@./build/translation_validator $(filter-out $@ build_and_run, $(MAKECMDGOALS))

build_and_run: build run

generate_ir:
	@python3 scripts/src2ir.py

clean:
	rm -rf build

# special target to prevent make from treating arguments as targets
%:
	@:
