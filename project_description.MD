# Resumo do Projeto #

Helper para preenchimento de uma página HTML específica. Este Helper será chamado "Assistente Time Sheet".


# Cenário atual #

Atualmente temos uma rotina de trabalho onde informamos alguns dados referentes à nossa rotina de trabalho.

São eles:
 - Data
 - Duração
 - Classificação
 - Tipo
 - Origem (dependento da opção escolhida, mais um dos campos abaixo devem ser preenchidos, para maiores detalhes ler a sessão 'Insumos' abaixo)
   - Número de CAC
   - Número de GMUD
   - Número de SU
   - Representante
 - Descrição do Apontamento

É um processo repetitivo que toma muito tempo do usuário. Este tempo pode ser otimizado pois muitas vezes os valores informados são os mesmos e podemos preencher a tela se tivermos um assistente que pegam templates pré-cadastrados e já preencham os campos

# Entes envolvidos #

 - "tela de apontamento"
 - "tela principal"
 - "popover"


# Objetivo do Projeto #

1) Criar uma extensão a ser instalada no Microsoft Edge.

2) Se possível, fazer de um modo que esta extensão seja flexível e possa ser instalada no Google e no Mozilla Firefox

3) Sempre que aberta a página descrita abaixo em "Restrições", que será chamada sempre por "tela de apontamento" deve-se injetar na página um pequeno popover flutuante.

4) A função deste popover é, ao ser clicado, abrir o tela principal da nossa extensão, e vou sempre referenciá-lo por "popover" para facilitar

5) O popover deve ser dragabble 

6) A posição do popover deve ser salva localmente para que na próxima vez que a tela de apontamento for aberta trazer o popover aberto em sua última posição

7) Caso não exista salva a posição do popover, utilizar o default, canto superior direito da página.

8) O popover deve manter sua posição fixa na tela em caso de rolagem da mesma (tanto horizontal quanto vertical)

9) O popover deve ter 30px x 30px

10) O popover deve projetar uma sobra discreta em seu canto inferior direito

11) Deve ter só "emoji de varinha mágica", ao passar o mouse acima exibir um title "Assistente Time Sheet"

12) Ao ser clicado deve abrir a tela principal do assistente, vou chamar de "tela principal"

13) colocar uma animação de abertura no estilo "esticando"

14) A "tela principal" será composta por cabeçalho, corpo e rodapé.

15) O cabeçalho da tela principal deve um título centralizado e um "x" (fechar) no canto direito

16) O título deve ter o mesmo emoji do popover mais o "Assistente Time Sheet"

17) ao clicar no x a "tela principal" deve ser fechada usando uma animação "encolhendo" na direção de onde está o popover, justamente para parecer que o popover cresce e vira a "tela principal" e a "tela principal" encolhe e vira o "popover"

18) O corpo da tela principal deve ter uma lista com os "templates" cadastrados e mais 3 ícones: "Utilizar", "Favoritar", "Editar" e "Excluir"

19) O corpo deve rolar por baixo do cabeçalho e por baixo do rodapé caso tenha itens o suficiente para gerar um corpo tão grande que gere uma barra de rolagem

20) Caso não exista nenhum template cadastrado, apresentar a mensagem "Nenhum template cadastrado. O que você está esperando para começar a economizar seu tempo? [emoji de foguete]"

21) Deve ser ordenada por "favoritos = true" e Data/hora de última utilização

22) Ao clicar em "Utilizar" deve preencher os campos da "tela de apontamento", salvar a data/hora de última utilização e fechar a "tela principal", com o mesmo efeito de ter clicado no x do cabeçalho

23) Ao clicar em "Favoritar" (ícone de coração acesso ou apagado, refletindo o true/false) devemos disparar um toggle, marcando favorito como true ou false (invertendo a sua condição atual) e atualizar a tela de modo que os templates cadastrados se reordenem 

24) Ao clicar em "Editar" deve abrir um modal "tela de edição" com os campos do template e permitir que o usuário altere os campos Classificação, Tipo, Origem, Número de CAC ou Número de GMUD ou Número de SU ou Representante (dependento da opção escolhida, para maiores detalhes ler a sessão 'Insumos' abaixo) e Descrição do Apontamento

25) Ao clicar em "Excluir" deve excluir de vez o template

25) o rodapé deve ser uma barra horizaontal estreita e transparente fixada na parte inferior

26) deve ter somente um emoji aleatório que muda a cada vez que a "tela principal" for aberta

27) o title deste emoji deve ser: "Desenvolvido com muito carinho por alguém que estava pensando em você [emoji wink]"

28) A "tela principal" deve tentar ao máximo possível usar os mesmos estilos CSS da "tela de apontamento", para dar uma impressão de realmente fazer parte da página

29) Sempre que o usuário inclui um novo apontamento na "tela de apontamento", clicando no botão "Salvar Apontamento" criar um template novo desde que o apontamento atual não tenha sido fruto de um clique no ícone "Utilizar" da "tela principal" e que já não haja algum template cadastrado com as mesmas características



# Restrições #

1) A extensão deve ser ativada somente se a página navegada estiver dentro dos domínios:

- www.intergrall.com.br
- wwws.intergrall.com.br
- www2.uranet.com.br
- dev.intergrall.com.br
- linux07

2) Além do domínio deve ser ativada somente se o caminho sendo executado for "callcenter/apontamento_atividade_2.php"

3) Além das condições acima, deve ser ativada quando a div com a classe modal--wrapper estiver visível


# Insumos #

1) Código fonte [./example_page.html]
  Arquivo contendo um modelo do HTML que devemos monitorar, extrair os dados (para salvar em uma memória local) e oferecer sugestão de preenchimento

2) Imagem [./pagina_renderizada_origem_cac.png]
  Página renderizada quando a origem selecionada é CAC, solicitando ao usuário que digite um número de CAC

3) Imagem [./pagina_renderizada_origem_gmud.png]
  Página renderizada quando a origem selecionada é GMUD, solicitando ao usuário que digite um número de GMUD

4) Imagem [./pagina_renderizada_origem_outro.png]
  Página renderizada quando a origem selecionada é Outro, solicitando ao usuário escolher no combo um representante

5) Imagem [./pagina_renderizada_origem_su.png]
  Página renderizada quando a origem selecionada é SU, solicitando ao usuário um número de SU
