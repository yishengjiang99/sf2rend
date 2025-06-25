FROM emscripten/emsdk:latest as emk
COPY . .
RUN ls
RUN emcc src/spin.c -Oz -o spin.html \
	--no-entry \
	-s EXPORT_ALL=1 \
	-s INITIAL_MEMORY=1024mb \
	-s ENVIRONMENT=web \
	-s EXPORT_ES6=1 \
	-s MODULARIZE=1 \
	-s SINGLE_FILE=1 \
	-s EXPORT_ES6=1
