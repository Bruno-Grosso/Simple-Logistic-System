FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/index.ts .
RUN mkdir src && mkdir build && chown -R bun:bun build
COPY --from=prerelease /usr/src/app/src/*.ts src/
COPY --from=prerelease /usr/src/app/package.json .

USER bun
EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "dev" ]
