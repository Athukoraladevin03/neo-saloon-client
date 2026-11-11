import { NextRequest, NextResponse } from 'next/server';

// Frontends allowed to call this API with cookies (credentials).
// Browsers reject "*" when credentials are included, so the exact origin must be echoed back.
const allowedOrigins = [
  'http://localhost:3001', // admin-neo-saloon
];

const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export function proxy(request: NextRequest) {

  const origin = request.headers.get('origin') ?? '';

  const originHeaders: Record<string, string> = allowedOrigins.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {};

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...originHeaders,
        ...corsHeaders,
      },
    });
  }

  // Handle normal requests
  const response = NextResponse.next();

  Object.entries({ ...originHeaders, ...corsHeaders }).forEach(([key, value]) =>
    response.headers.set(key, value)
  );
  return response;
}
