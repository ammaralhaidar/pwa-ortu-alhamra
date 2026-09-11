# Step 1: Install dependencies only when needed
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci

# Step 2: Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_ODOO_URL=https://sipp.ibsalhamra.sch.id
ARG NEXT_PUBLIC_ODOO_DB=db_alhamra_production
ENV NEXT_PUBLIC_ODOO_URL=$NEXT_PUBLIC_ODOO_URL
ENV NEXT_PUBLIC_ODOO_DB=$NEXT_PUBLIC_ODOO_DB
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm run build

# Step 3: Production runner with Next.js Standalone
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
