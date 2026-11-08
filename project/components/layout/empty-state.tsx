'use client';

import Image from 'next/image';

export function EmptyState() {
  return <div className="flex min-h-[68vh] flex-col items-center justify-center text-center"><div className="relative mb-7 flex h-40 w-40 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.2),transparent_68%)]"><Image src="/logo.png" alt="Produto X" width={128} height={128} className="logo-screen object-contain" priority /></div><h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Seu Segundo Cérebro</h1><p className="mt-3 max-w-lg text-sm leading-6 text-[#A3A3A3]"><span className="hidden md:inline">Digite uma pergunta à esquerda e receba um mosaico de blocos — introdução, crítica, código, slides e gráfico. Arraste para reordená-los.</span><span className="md:hidden">Digite uma pergunta abaixo e receba um mosaico de blocos — introdução, crítica, código, slides e gráfico. Arraste para reordená-los.</span></p></div>;
}
