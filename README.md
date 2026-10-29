# MouraWear — Frontend

Loja streetwear em React + Vite + Tailwind v4.

- Home = catálogo público (sem login). Login/cadastro só é pedido ao adicionar ao carrinho — o item é guardado e entra no carrinho após o login.
- Produto com tamanhos e estoque por tamanho, favoritos, carrinho lateral com barra de frete grátis.
- Checkout com busca de CEP (ViaCEP), PIX / WhatsApp / Mercado Pago.
- Painel `/admin`: dashboard, pedidos, produtos (upload de fotos), categorias, banners, usuários, configurações.

## Rodar local
```bash
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm install
npm run dev            # http://localhost:5173
```

## Deploy na Vercel
Importe o repositório (framework Vite) e defina `VITE_API_URL` com a URL do backend no Render.
Admin: `mourawear@admin.com` / senha definida em `ADMIN_PASSWORD` no Render (padrão `12345678`).
