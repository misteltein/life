import P5 from "p5";

const CellState = {
    living: true,
    dead: false
} as const;

type CellStateType = boolean;

type World = Array<Array<CellStateType>>

interface Location {
    x: number;
    y: number;
}


const sketch = (p5: P5) => {
    let currentWorld: World = [];
    p5.setup = () => {
        p5.createCanvas(300, 300);
        p5.background(51);
        currentWorld = [
            [CellState.living, CellState.living, CellState.dead],
            [CellState.living, CellState.dead, CellState.dead],
            [CellState.dead, CellState.dead, CellState.dead],
        ];
        view(currentWorld);
    };

    p5.draw = () => {
        currentWorld = currentWorld.map((row: Array<CellStateType>, i: number) => {
            return row.map((cell: CellStateType, j: number) => {
                return computeNextState(currentWorld, {x: i, y: j})
            })
        })
        p5.noLoop();
    }

    /**
     * セルの状態を取得する
     * @param {World} world - セルのマトリクス
     * @param {Location} p - 中心のセルの座標
     * @return {CellStateType} - セルの状態
     */
    function getState(world: World, p: Location): CellStateType {
        return world[p.x][p.y];
    }

    /**
     * 周囲のセルについて生存をカウントする
     * @param {World} world - セルのマトリクス
     * @param {Location} p - 中心のセルの座標
     * @return {number} - 生存数
     */
    function countLivingCells(world: World, p: Location): number {
        let count = 0;
        for (let i = -1; i <= 1; ++i) {
            for (let j = -1; j <= 1; ++j) {
                if (i === 0 && j === 0) continue;
                if (getState(world, p) === CellState.living) {
                    count += 1;
                }
            }
        }
        return count;
    }

    /**
     * セルの次の状態を計算する
     * @param {World} world - セルのマトリクス
     * @param {Location} p - 中心のセルの座標
     * @return {CellStateType} - 次の状態
     */
    function computeNextState(world: World, p: Location): CellStateType {
        switch (countLivingCells(world, p)) {
            case 3:
                return CellState.living;
            case 2:
                return getState(world, p);
            default:
                return CellState.dead;
        }
    }

    function view(world: World): void {
        const res = world.map((row: Array<boolean>) => {
            return row.map((cell: CellStateType) => {
                return cell ? '生' : '死';
            }).join(' ');
        }).join('\n');
        console.log(res);
    }
};

/* eslint-disable no-new */
new P5(sketch);
