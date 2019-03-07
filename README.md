# webgl-cg
Trabalho final para disciplina de computação gráfica da [UFERSA](https://ufersa.edu.br)


#### Escopo

A Web Graphics Library é uma API em JavaScript baseada na OpenGL ES 2.0, e fornece uma interface de programação de gráficos 2D e 3D a partir de novo elemento canvas do HTML5. Pode ser implementada em uma aplicação web sem a necessidade de plug-ins no navegador.

A proposta de trabalho é apresentar a WebGL usando algumas atividades feitas com OpenGL na disciplina de computação gráfica. O resultado seria, além de claro os artefatos de código, um artigo/relatório sobre a WebGL descrevendo os esforços e resultados das atividades feitas com ela.

As atividades serão:

1. Fazer um programa equivalente ao exemplo presente em https://www.inf.pucrs.br/~manssour/OpenGL/Desenhando.html e:
	- Alterar, de forma aleatória, a cor de fundo, quando o botão esquerdo do mouse é clicado.
	- Alterar, de forma aleatória, a cor do objeto quando o botão direito do mouse é clicado.
	- Aplicar a alteração de cor do objeto através do teclado:
		- Apertando ‘r’ o objeto fica vermelho.
		- Apertando ‘g’ o objeto fica verde.
		- Apertando ‘b’ o objeto fica azul.
		- Apertando ‘c’ o objeto fica ciano.
		- Apertando ‘m’ o objeto fica magenta.
		- Apertando ‘y’ o objeto fica amarelo.
2. Implementar uma proteção de tela em onde a figura geométrica animada fique passeando pela tela e mude a direção do movimento quando colidir com uma das bordas da janela gráfica.
	- Adicionar interação com teclado para aumentar ou diminuir a velocidade de movimentação.
	- Adicionar interação com o Mouse a fim de abrir menu que permite modificar o objeto animado e a cor do mesmo.
3. Acrescentar na sua proteção de tela, agora em 3D, as operações de translação, escala e rotação.
	- Possibilite que o usuário mude o sentido de rotação pelo teclado.
	- Adicione uma forma do usuário possa escolher entre uma projeção perspectiva ou paralela (adicione múltiplas configurações para cada tipo de projeção).
	- Inclua uma forma do usuário mudar a posição de observação da cena, a direção de visualização e orientação da câmera.
4. Implementar um visualizador de objetos 3D
	- Construa uma estrutura de dados para representação de coordenadas, vértices e faces da estrutura.
	- Implemente um leitor de arquivos do formato ply (https://en.wikipedia.org/wiki/PLY_(file_format) e http://paulbourke.net/dataformats/ply/) para fazer a leitura dos objetos.
	- O sistema deve possibilitar a manipulação por parte do usuário através de rotação, translação e escala do objeto na cena. 

*Arquivos no formato ply podem ser encontrados em http://graphics.stanford.edu/data/3Dscanrep/.*


#### Resultados:

1. [Drawing](./drawing.html).
2. [SaveScreen](./savescreen.html).
3. [SaveScreen3D](./savescreen3d.html).
4. [MontyPlython](./)