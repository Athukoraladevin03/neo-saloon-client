# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Backend API for a salon business ("Neo Saloon"): users/auth, products, and appointments (stub). Stack: Next.js 16 App Router route handlers, Prisma 7 with the `@prisma/adapter-pg` driver adapter on PostgreSQL, `jose` JWTs, `bcryptjs`, and `zod` v4. The UI is still the create-next-app placeholder (`app/page.tsx`).

## Commands

- `npm run dev` / `npm run build` / `npm run start`
- There is no lint script, test framework, or tests. Use `npx tsc --noEmit` to type-check.
- Prisma config lives in `prisma7.config.ts`, which the CLI picks up automatically:
  - `npx prisma generate` writes the client to `app/generated/prisma/`, which is gitignored. Run it after cloning and after every schema change.
  - `npx prisma migrate dev --name <name>`
  - `npx prisma db seed` runs `tsx prisma/seed.ts` and seeds an ADMIN user.
- Required env vars (in `.env`): `DATABASE_URL`, `JOSE_SECRET`.

## Architecture

- **API only, in `app/api/<resource>/route.ts`.** Each file exports `GET`/`POST`/`PUT`/`DELETE` handlers. Resource IDs are passed as the `?id=` query param, not as dynamic route segments (e.g. `PUT /api/users?id=...`, `GET /api/products/byId?id=...`).
- **Prisma client:** always import the singleton `prisma` from `@/lib/prisma`. Import generated types and enums from `@/app/generated/prisma/enums` or `.../client`, not from `@prisma/client`. Model names are lowercase (`user`, `product`), except `Media`.
- **Auth:** `POST /api/auth` checks the password with bcrypt, signs an HS256 JWT with `JOSE_SECRET`, and sets it in the httpOnly cookie `Login-token` (7 days). There is no middleware. Each handler checks auth itself using `utils/authentication.ts`:
  - `getUser(request)` returns the decoded `RequestUserType`, or `null`.
  - `isPrivilaged(request, "resource:action")` checks the user's `privilages` string array. The project spells it "privilage" everywhere; keep that spelling.
  - Authorization uses privilege strings stored on the user row (e.g. `users:read`, `users:edit`, `products:add`, `products:update`, `products:delete`, `products:view`/`products:read`). `role` is not used for access checks.
- **Validation:** Zod schemas live in `types/dto/*Request.ts`. Handlers wrap their logic in try/catch and, on a `z.ZodError`, return `error.issues[0].message` with status 400. Product schemas build zod enums from the Prisma-generated enums (`z.enum(ProductStatus)`).
- **Pagination:** `utils/pageInfoRetrieval.ts` reads `?pageNumber=&pageSize=` (defaults 1 and 10). List responses include `pagination: { pageNumber, pageSize, totalPages, totalCount }`.
- **Products:** delete is a soft delete (`status = DELETED`). Public reads see only `ACTIVE` products; privileged reads see everything except `DELETED`. A `PUT` with `media` replaces all of the product's `Media` rows.
- Responses use the shape `NextResponse.json({ message, ...data }, { status })`.

## Known gotchas

- The JWT payload is signed with `firstName`/`lastName`, but `RequestUserType` declares `firstname`/`lastname`, so those fields are undefined on `getUser()` results.
- Some product handlers write `return NextResponse.json({...}) , {status: 400}`. The comma operator drops the status object, so these responses return 200.
- Partial updates use `body.x || existing.x`, so falsy values (`0`, `""`) can't be set. For example, stock can't be set to 0.
- `app/api/appointments/route.ts` is an unfinished stub: `getUser` isn't awaited and the handler returns nothing.
