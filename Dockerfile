# Single-stage on purpose. A multi-stage build with `output: "standalone"`
# would produce a smaller image, but the seed script is a devDependency-driven
# TypeScript file and the reviewer's first experience of this repo is
# `docker compose up` — reliability beats image size here.

FROM node:22-alpine

WORKDIR /app

# Dependencies first, so editing source does not invalidate the install layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "./docker/entrypoint.sh"]
