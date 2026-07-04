// ProductCard Component for Marketplace
// Displays product listings with essential information for creators

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const ProductCard = ({
  product,
  showBuyButton = true,
}: {
  product: {
    id: string;
    title: string;
    vendor: string;
    description: string;
    price: number;
    rating: number;
    downloads: number;
    imageUrl: string;
    category: string;
    isVerified?: boolean;
  };
  showBuyButton?: boolean;
}) => {
  const { id, title, vendor, description, price, rating, downloads, imageUrl, category, isVerified } = product;

  return (
    <>
      <div className="group relative rounded-md bg-zinc-900 border border-zinc-700 hover:scale-1005 transition-transform border-l-2 border-orange-500 aspect-w-12 aspect-h-12 flex-shrink-0">
        {showBuyButton && (
          <Link
            href={`/product/${id}`}
            className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 bg-orange-700 text-sm text-zinc-950 rounded-xl bg-opacity-80 group-hover:bg-opacity-100 transition-colors"
          >
            {isVerified && (
              <span className="block h-3 w-3 bg-green-400 rounded-full animate-pulse" />
            )}
            BUY
          </Link>
        )}

        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={100}
            height={100}
            className="w-full h-full object-cover rounded md:rounded-lg group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="absolute w-full h-full bg-zinc-800 rounded md:rounded-lg flex items-center justify-center text-sm opacity-50">
            Preview
          </div>
        )}
      </div>

      <Link
        href={`/product/${id}`}
        className="group-hover:opacity-100 transition-opacity flex flex-col group items-stretch bg-zinc-900 rounded-lg p-4"
      >
        <h3 className="text-white font-medium text-lg title-font">{title}</h3>
        <p className="text-zinc-400 text-sm py-1">{category}</p>
        <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">{description}</p>
        <p className="flex-1 text-white-300 text-size-4 text-zinc-400 py-2">{(price).toFixed(2)} Credits</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-amber-300 space-x-1">
            {Array.from({ length: Math.round(rating) }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            ))}
          </span>
          {downloads} downloads
        </div>
      </Link>
    </>
  );
};