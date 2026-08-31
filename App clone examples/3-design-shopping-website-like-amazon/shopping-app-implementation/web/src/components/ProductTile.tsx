'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { useAddToCartMutation } from '../store/api';
import { formatMoney } from '../lib/format';
import { Stars } from './Stars';
import type { ProductCard } from '../types';

export function ProductTile({ product }: { product: ProductCard }) {
  const router = useRouter();
  const isAuthed = useAppSelector((s) => !!s.auth.user);
  const [addToCart, { isLoading }] = useAddToCartMutation();

  const add = async () => {
    if (!isAuthed) {
      router.push('/login');
      return;
    }
    await addToCart({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      image: product.image,
      qty: 1,
    });
  };

  const onSale = product.regularPriceCents != null && product.regularPriceCents > product.priceCents;

  return (
    <div className="product-card">
      <Link href={`/product/${product.id}`} className="thumb">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} />
        ) : (
          <span className="ph">No image</span>
        )}
      </Link>
      <Link href={`/product/${product.id}`}>
        <h3 className="product-title">{product.name}</h3>
      </Link>
      {product.rating > 0 && <Stars rating={product.rating} />}
      <div style={{ margin: '6px 0' }}>
        <span className="price">{formatMoney(product.priceCents, product.currency)}</span>
        {onSale && <span className="strike">{formatMoney(product.regularPriceCents!, product.currency)}</span>}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        {product.inStock ? (
          <span className="badge badge-green">In stock</span>
        ) : (
          <span className="badge badge-gray">Out of stock</span>
        )}
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 10 }}
        onClick={add}
        disabled={isLoading || !product.inStock}
      >
        {isLoading ? 'Adding…' : 'Add to cart'}
      </button>
    </div>
  );
}
