# Vercel Front-End

Mini app do cardapio digital para rodar separado do PDV desktop.

Este front foi criado para abrir pelo QR Code da mesa, carregar os dados do Supabase e permitir que o cliente monte e envie o pedido direto pelo celular.

## O que ele faz

- Abre a mesa pela rota `/mesa/:id/:code`.
- Tambem aceita a rota por query string: `?path=/mesa/:id/:code`.
- Valida a mesa no Supabase.
- Carrega configuracao da loja, categorias e produtos.
- Captura nome e celular do cliente.
- Monta carrinho e envia pedido para `customer_orders`.

## Visual

O layout foi ajustado para ficar mais parecido com uma tela de mobile de balcao:

- fundo externo escuro
- cards internos brancos
- contraste maior para leitura
- titulos e preco em destaque
- botoes laranja mais fortes
- cards de produto mais limpos e legiveis

## Estrutura

- `index.html`: entrada da aplicacao.
- `src/main.js`: logica do fluxo do cliente.
- `src/styles.css`: visual do cardapio.
- `vite.config.js`: build para Vercel.
- `public/404.html`: fallback para rotas diretas.
- `.env.example`: modelo das variaveis de ambiente.

## Variaveis de ambiente

Configure na Vercel:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Essas variaveis devem existir no projeto da Vercel para o front conseguir conectar no Supabase.

## Rotas esperadas

Exemplo principal:

```text
/mesa/3/CODE123
```

Exemplo com query string:

```text
/?path=/mesa/3/CODE123
```

## Deploy na Vercel

1. Crie um projeto novo na Vercel apontando para a pasta `vercel/`.
2. Defina o root directory como `vercel`.
3. Use o build do Vite:
   - build command: `npm run build`
   - output directory: `dist`
4. Adicione as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Se quiser acesso publico pelo QR Code, verifique a protecao de deploy da Vercel para nao bloquear visitantes anonimos.

## Alterar o nome da loja no Supabase

Se o texto do topo continuar aparecendo como `Loja Exemplo`, atualize o valor direto no SQL Editor do Supabase.

Use este comando:

```sql
UPDATE public.store_settings
SET store_name = 'TFRTech',
    updated_at = now()
WHERE id = (
  SELECT id
  FROM public.store_settings
  ORDER BY updated_at DESC NULLS LAST, id
  LIMIT 1
);

SELECT id, store_name, updated_at
FROM public.store_settings
ORDER BY updated_at DESC NULLS LAST, id
LIMIT 1;
```

Se preferir, o arquivo pronto para copiar fica em:

- `vercel/sql/update-store-name.sql`

## Observacoes

- O front nao substitui o sistema principal do PDV.
- O QR da mesa precisa conter o `id` e o `code` corretos para a mesa abrir.
- Se a URL abrir 404, confira se o dominio da Vercel e o dominio que esta sendo usado no QR sao o mesmo.
