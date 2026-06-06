import { NextResponse } from 'next/server';
import { getArticlesForCategory } from '@/lib/news';

export const maxDuration = 60; // Max duration for Vercel

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'India';
  
  const articles = await getArticlesForCategory(category);
  return NextResponse.json({ articles });
}
