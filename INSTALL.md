# Assistente Time Sheet — Instalação local

Extensão não publicada em lojas. Use carregamento sem empacotamento.

## Pré-requisitos
- Microsoft Edge (ou Chrome) recente; para Firefox, suporte limitado a Manifest V3 (funciona nas versões mais novas em modo `about:debugging`).
- Esta pasta (`tshHelper/`) contém todos os arquivos da extensão.

## Passo a passo — Edge/Chrome
1) Abra `edge://extensions` (ou `chrome://extensions`).
2) Ative **Modo do desenvolvedor**.
3) Clique em **Carregar sem empacotamento** (Edge/Chrome) ou **Load unpacked**.
4) Selecione a pasta do projeto (`tshHelper`, onde está `manifest.json`).
5) A extensão aparecerá na lista. Certifique-se de que está ativada.

## Passo a passo — Firefox (temporária)
1) Abra `about:debugging#/runtime/this-firefox`.
2) Clique em **Carregar extensão temporária**.
3) Aponte para o `manifest.json` dentro desta pasta.
4) A extensão será carregada até fechar o navegador.

## Onde ela roda
- Apenas em páginas dos domínios: `www.intergrall.com.br`, `wwws.intergrall.com.br`, `www2.uranet.com.br`, `dev.intergrall.com.br`, `linux07`.
- Caminho obrigatório: `callcenter/apontamento_atividade_2.php`.
- A div `.modal--wrapper` precisa estar visível para o popover aparecer.

## Como usar (resumo)
- Abra a tela de apontamento. Quando o modal estiver visível, o popover (emoji de varinha) surge no canto superior direito (arrastável, posição salva).
- Clique no popover para abrir a tela principal:
  - Lista templates (ordenados por favorito e última utilização).
  - Ações: Utilizar, Favoritar, Editar, Excluir.
  - Mensagem especial se não houver templates.
- Ao clicar em **Utilizar**, os campos da tela de apontamento são preenchidos e o painel fecha.
- Ao clicar em **Salvar Apontamento** manualmente, o assistente cria um novo template (se não vier de um “Utilizar” e se não existir template igual).
- Favoritar reordena a lista; editar abre um modal leve; excluir remove definitivamente.

## Notas de compatibilidade
- Manifest V3 com permissões mínimas (`storage` + content script). Não há background service worker.
- Ícones são placeholders locais.
- UI e estilos em `content.js` e `content.css` (stack vanilla).

## Dicas de debug
- Abra DevTools na página alvo e procure por logs `[ATS]` no console (o script loga carregamento, condições de ativação e criação de UI).
- No console, cheque `window.__atsHelperInitialized` e `document.querySelector('.ats-popover')`.
- Confirme o host/path exatos: deve conter `callcenter/apontamento_atividade_2.php` em um dos domínios permitidos.
- Para validar visibilidade da página-alvo: `getComputedStyle(document.querySelector('.modal--wrapper')).display`.
- Se o script não aparecer em Sources, remova e recarregue a extensão (ou use “Atualizar”/“Update” em `edge://extensions`).
## Remover ou atualizar
- Para remover: desative e exclua na página de extensões.
- Para atualizar: remova e carregue novamente a pasta, ou use “Atualizar” na página de extensões (Edge/Chrome).
