import {Graph, Node} from '@antv/x6';
import {CustomGraphService} from '../services/custom-graph.service';

export class Layout {
    graph: Graph;
    customGraphService: CustomGraphService;
    nodeWidth: number;
    nodeHeight: number;
    cellPadding: number;
    randomOffset: number;
    gridWidth: number;
    gridHeight: number;
    gridCellWidth: number;
    gridCellHeight: number;
    gridColCount: number;
    gridRowCount: number;
    gridCellCount: number;

    constructor(
        graph: Graph,
        customGraphService: CustomGraphService,
        nodeWidth: number,
        nodeHeight: number,
        cellPadding: number,
        randomOffset: number = 0,
        gridWidth: number = graph.container.clientWidth,
        gridHeight: number = graph.container.clientHeight
    ) {
        this.graph = graph;
        this.customGraphService = customGraphService;
        this.nodeWidth = nodeWidth;
        this.nodeHeight = nodeHeight;
        this.cellPadding = cellPadding;
        this.randomOffset = Math.min(randomOffset, cellPadding);
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.gridCellWidth = this.nodeWidth + 2 * this.cellPadding;
        this.gridCellHeight = this.nodeHeight + 2 * this.cellPadding;
        this.gridColCount = Math.floor(this.gridWidth / this.gridCellWidth);
        this.gridRowCount = Math.floor(this.gridHeight / this.gridCellHeight);
        this.gridCellCount = this.gridColCount * this.gridRowCount;
    }

    apply(targetNodes: Node<Node.Properties>[], animated: boolean) {
        const nodeGridCellOccupation: Array<[Node<Node.Properties>, number]> = [];
        const gridCells: Array<Array<Array<Node<Node.Properties>>>> = this.initArray();
        const allNodes = this.graph.getNodes();
        const staticNodes = allNodes.filter((node) => !targetNodes.includes(node));
        let occupiedCellCount = 0;

        occupiedCellCount = this.checkStaticNodes(staticNodes, gridCells, nodeGridCellOccupation);
        this.fixStaticNodes(nodeGridCellOccupation, occupiedCellCount, targetNodes.length, animated, gridCells);
        this.fixTargetNodes(targetNodes, true, gridCells);
    }

    private fixStaticNodes(
        nodeGridCellOccupation: Array<[Node<Node.Properties>, number]>,
        occupiedCellCount: number,
        targetNodesCount: number,
        animated: boolean,
        gridCells: Array<Array<Array<Node<Node.Properties>>>>
    ) {
        nodeGridCellOccupation.sort((n) => n[1]);
        while (this.gridCellCount - occupiedCellCount < targetNodesCount) {
            const nodeCell = nodeGridCellOccupation.shift();
            if (!nodeCell) break;

            const node = nodeCell[0];
            const topLeft = {
                x: node.getPosition().x,
                y: node.getPosition().y,
            };
            const topRight = {
                x: node.getPosition().x + node.size().width,
                y: node.getPosition().y,
            };
            const bottomLeft = {
                x: node.getPosition().x,
                y: node.getPosition().y + node.size().height,
            };
            const bottomRight = {
                x: node.getPosition().x + node.size().width,
                y: node.getPosition().y + node.size().height,
            };

            const cellTopLeft = {
                col: this.clampCol(topLeft.x / this.gridCellWidth),
                row: this.clampRow(topLeft.y / this.gridCellHeight),
            };
            const cellTopRight = {
                col: this.clampCol(topRight.x / this.gridCellWidth),
                row: this.clampRow(topRight.y / this.gridCellHeight),
            };
            const cellBottomLeft = {
                col: this.clampCol(bottomLeft.x / this.gridCellWidth),
                row: this.clampRow(bottomLeft.y / this.gridCellHeight),
            };
            const cellBottomRight = {
                col: this.clampCol(bottomRight.x / this.gridCellWidth),
                row: this.clampRow(bottomRight.y / this.gridCellHeight),
            };

            const cellTopLeftPos = {
                x: cellTopLeft.col * this.gridCellWidth + this.cellPadding,
                y: cellTopLeft.row * this.gridCellHeight + this.cellPadding,
            };
            const cellTopRightPos = {
                x: cellTopRight.col * this.gridCellWidth + this.cellPadding,
                y: cellTopRight.row * this.gridCellHeight + this.cellPadding,
            };
            const cellBottomLeftPos = {
                x: cellBottomLeft.col * this.gridCellWidth + this.cellPadding,
                y: cellBottomLeft.row * this.gridCellHeight + this.cellPadding,
            };
            const cellBottomRightPos = {
                x: cellBottomRight.col * this.gridCellWidth + this.cellPadding,
                y: cellBottomRight.row * this.gridCellHeight + this.cellPadding,
            };

            const dist2TopLeft = this.dist2(topLeft.x, topLeft.y, cellTopLeftPos.x, cellTopLeftPos.y);
            const dist2TopRight = this.dist2(topLeft.x, topLeft.y, cellTopRightPos.x, cellTopRightPos.y);
            const dist2BottomLeft = this.dist2(topLeft.x, topLeft.y, cellBottomLeftPos.x, cellBottomLeftPos.y);
            const dist2BottomRight = this.dist2(topLeft.x, topLeft.y, cellBottomRightPos.x, cellBottomRightPos.y);

            const minDist2 = Math.min(dist2TopLeft, dist2TopRight, dist2BottomLeft, dist2BottomRight);

            if (minDist2 == dist2TopLeft) {
                const pos = this.applyRandomOffset(cellTopLeftPos, this.randomOffset);
                if (animated) this.customGraphService.animateMove(node, pos.x, pos.y);
                else node.setPosition(pos.x, pos.y);
                gridCells[cellTopRight.row][cellTopRight.col].splice(
                    gridCells[cellTopRight.row][cellTopRight.col].indexOf(node),
                    1
                );
                if (gridCells[cellTopRight.row][cellTopRight.col].length == 0) occupiedCellCount--;
                gridCells[cellBottomLeft.row][cellBottomLeft.col].splice(
                    gridCells[cellBottomLeft.row][cellBottomLeft.col].indexOf(node),
                    1
                );
                if (gridCells[cellBottomLeft.row][cellBottomLeft.col].length == 0) occupiedCellCount--;
                gridCells[cellBottomRight.row][cellBottomRight.col].splice(
                    gridCells[cellBottomRight.row][cellBottomRight.col].indexOf(node),
                    1
                );
                if (gridCells[cellBottomRight.row][cellBottomRight.col].length == 0) occupiedCellCount--;
            } else if (minDist2 == dist2TopRight) {
                const pos = this.applyRandomOffset(cellTopRightPos, this.randomOffset);
                if (animated) this.customGraphService.animateMove(node, pos.x, pos.y);
                else node.setPosition(pos.x, pos.y);
                gridCells[cellTopLeft.row][cellTopLeft.col].splice(
                    gridCells[cellTopLeft.row][cellTopLeft.col].indexOf(node),
                    1
                );
                if (gridCells[cellTopLeft.row][cellTopLeft.col].length == 0) occupiedCellCount--;
                gridCells[cellBottomLeft.row][cellBottomLeft.col].splice(
                    gridCells[cellBottomLeft.row][cellBottomLeft.col].indexOf(node),
                    1
                );
                if (gridCells[cellBottomLeft.row][cellBottomLeft.col].length == 0) occupiedCellCount--;
                gridCells[cellBottomRight.row][cellBottomRight.col].splice(
                    gridCells[cellBottomRight.row][cellBottomRight.col].indexOf(node),
                    1
                );
                if (gridCells[cellBottomRight.row][cellBottomRight.col].length == 0) occupiedCellCount--;
            } else if (minDist2 == dist2BottomLeft) {
                const pos = this.applyRandomOffset(cellBottomLeftPos, this.randomOffset);
                if (animated) this.customGraphService.animateMove(node, pos.x, pos.y);
                else node.setPosition(pos.x, pos.y);
                gridCells[cellTopLeft.row][cellTopLeft.col].splice(
                    gridCells[cellTopLeft.row][cellTopLeft.col].indexOf(node),
                    1
                );
                if (gridCells[cellTopLeft.row][cellTopLeft.col].length == 0) occupiedCellCount--;
                gridCells[cellTopRight.row][cellTopRight.col].splice(
                    gridCells[cellTopRight.row][cellTopRight.col].indexOf(node),
                    1
                );
                if (gridCells[cellTopRight.row][cellTopRight.col].length == 0) occupiedCellCount--;
                gridCells[cellBottomRight.row][cellBottomRight.col].splice(
                    gridCells[cellBottomRight.row][cellBottomRight.col].indexOf(node),
                    1
                );
                if (gridCells[cellBottomRight.row][cellBottomRight.col].length == 0) occupiedCellCount--;
            } else {
                const pos = this.applyRandomOffset(cellBottomRightPos, this.randomOffset);
                if (animated) this.customGraphService.animateMove(node, pos.x, pos.y);
                else node.setPosition(pos.x, pos.y);
                gridCells[cellTopLeft.row][cellTopLeft.col].splice(
                    gridCells[cellTopLeft.row][cellTopLeft.col].indexOf(node),
                    1
                );
                if (gridCells[cellTopLeft.row][cellTopLeft.col].length == 0) occupiedCellCount--;
                gridCells[cellTopRight.row][cellTopRight.col].splice(
                    gridCells[cellTopRight.row][cellTopRight.col].indexOf(node),
                    1
                );
                if (gridCells[cellTopRight.row][cellTopRight.col].length == 0) occupiedCellCount--;
                gridCells[cellBottomLeft.row][cellBottomLeft.col].splice(
                    gridCells[cellBottomLeft.row][cellBottomLeft.col].indexOf(node),
                    1
                );
                if (gridCells[cellBottomLeft.row][cellBottomLeft.col].length == 0) occupiedCellCount--;
            }
        }
    }

    private fixTargetNodes(
        targetNodes: Node<Node.Properties>[],
        animated: boolean,
        gridCells: Array<Array<Array<Node<Node.Properties>>>>
    ) {
        let targetNodeIndex = 0;
        let nodeExist = true;
        for (let row = 0; row < this.gridRowCount; row++) {
            for (let col = 0; col < this.gridColCount; col++) {
                if (gridCells[row][col].length == 0) {
                    const x =
                        col * this.gridCellWidth +
                        this.cellPadding +
                        Math.floor(Math.random() * (this.randomOffset * 2 + 1)) -
                        this.randomOffset;
                    const y =
                        row * this.gridCellHeight +
                        this.cellPadding +
                        Math.floor(Math.random() * (this.randomOffset * 2 + 1)) -
                        this.randomOffset;
                    if (animated) this.customGraphService.animateMove(targetNodes[targetNodeIndex++], x, y);
                    else targetNodes[targetNodeIndex++].setPosition(x, y);
                    if (targetNodeIndex == targetNodes.length) {
                        nodeExist = false;
                        break;
                    }
                }
            }
            if (!nodeExist) break;
        }
    }

    private checkStaticNodes(
        staticNodes: Node<Node.Properties>[],
        gridCells: Array<Array<Array<Node<Node.Properties>>>>,
        nodeGridCellOccupation: Array<[Node<Node.Properties>, number]>
    ) {
        let occupiedCellCount = 0;
        for (let node of staticNodes) {
            const topLeft = {
                x: node.getPosition().x,
                y: node.getPosition().y,
            };
            const topRight = {
                x: node.getPosition().x + node.size().width,
                y: node.getPosition().y,
            };
            const bottomLeft = {
                x: node.getPosition().x,
                y: node.getPosition().y + node.size().height,
            };
            const bottomRight = {
                x: node.getPosition().x + node.size().width,
                y: node.getPosition().y + node.size().height,
            };

            const cellTopLeft = {
                col: this.clampCol(topLeft.x / this.gridCellWidth),
                row: this.clampRow(topLeft.y / this.gridCellHeight),
            };
            const cellTopRight = {
                col: this.clampCol(topRight.x / this.gridCellWidth),
                row: this.clampRow(topRight.y / this.gridCellHeight),
            };
            const cellBottomLeft = {
                col: this.clampCol(bottomLeft.x / this.gridCellWidth),
                row: this.clampRow(bottomLeft.y / this.gridCellHeight),
            };
            const cellBottomRight = {
                col: this.clampCol(bottomRight.x / this.gridCellWidth),
                row: this.clampRow(bottomRight.y / this.gridCellHeight),
            };

            const uniqueCells: {row: number; col: number}[] = [];
            [cellTopLeft, cellTopRight, cellBottomLeft, cellBottomRight].forEach((cell) => {
                if (!uniqueCells.find((c) => cell.col == c.col && cell.row == c.row)) {
                    uniqueCells.push(cell);
                }
            });

            nodeGridCellOccupation.push([node, uniqueCells.length]);
            uniqueCells.forEach((uc) => {
                if (gridCells[uc.row][uc.col].length == 0) occupiedCellCount++;
            });

            gridCells[cellTopLeft.row][cellTopLeft.col].push(node);
            gridCells[cellTopRight.row][cellTopRight.col].push(node);
            gridCells[cellBottomLeft.row][cellBottomLeft.col].push(node);
            gridCells[cellBottomRight.row][cellBottomRight.col].push(node);
        }
        return occupiedCellCount;
    }

    private clampRow(row: number) {
        return this.clamp(Math.floor(row), 0, this.gridRowCount - 1);
    }

    private clampCol(col: number) {
        return this.clamp(Math.floor(col), 0, this.gridColCount - 1);
    }

    private initArray() {
        const gridCells: Array<Array<Array<Node<Node.Properties>>>> = Array(this.gridRowCount);
        for (let i = 0; i < this.gridRowCount; i++) {
            gridCells[i] = Array(this.gridColCount);

            for (let j = 0; j < this.gridColCount; j++) {
                gridCells[i][j] = [];
            }
        }
        return gridCells;
    }

    private dist2(x1: number, y1: number, x2: number, y2: number) {
        return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    }

    private clamp(n: number, minValue: number, maxValue: number) {
        return Math.max(minValue, Math.min(maxValue, n));
    }

    private applyRandomOffset(pos: {x: number; y: number}, randomOffset: number) {
        const x = pos.x + Math.floor(Math.random() * (randomOffset * 2 + 1)) - randomOffset;
        const y = pos.y + Math.floor(Math.random() * (randomOffset * 2 + 1)) - randomOffset;
        return {x, y};
    }
}
