import { NextRequest, NextResponse } from 'next/server';


const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export function proxy(request: NextRequest) {

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...( { 'Access-Control-Allow-Origin': "*" }),
        ...corsHeaders,
      },
    });
  }

  // Handle normal requests
  const response = NextResponse.next();

  Object.entries(corsHeaders).forEach(([key, value]) =>
    response.headers.set(key, value)
  );
  return response;
}