.PHONY: build run build_and_run clean

build:
	bash scripts/build.sh

run:
	@./build/translation_validator $(filter-out $@ build_and_run, $(MAKECMDGOALS))

build_and_run: build run

clean:
	rm -rf build

# special target to prevent make from treating arguments as targets
%:
	@:
