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

const SIZE_X = 150;
const SIZE_Y = 100;

const sketch = (p5: P5) => {
    let currentWorld: World = [];
    let selectedMode: P5.Element;
    p5.setup = () => {
        p5.createCanvas(900, 600);
        p5.background(51);
        p5.frameRate(1);

        selectedMode = p5.createSelect();
        selectedMode.option('random 0.10');
        selectedMode.option('random 0.25');
        selectedMode.option('random 0.50');
        selectedMode.option('random 0.75');
        selectedMode.changed(handleChangeMode);
        currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.2);
        view(currentWorld);
    };

    p5.draw = () => {
        const newWorld = computeNextGeneration(currentWorld);
        // 収束していたら終了（振動は検出していない）
        if (equals(currentWorld, newWorld)) {
            p5.noLoop();
            console.log('terminated')
        } else {
            // 変化があれば採用
            currentWorld = newWorld;
        }
        const dx = p5.width / SIZE_X;
        const dy = p5.height / SIZE_Y;
        p5.noStroke();
        currentWorld.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    p5.fill(255);
                } else {
                    p5.fill(0);
                }
                p5.rect(i * dx, j * dy, dx, dy);
            })
        })
    }

    function handleChangeMode() {
        const item = selectedMode.value();
        if (item === 'random 0.2') {
            currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.2);
        }
        switch (selectedMode.value()) {
            case 'random 0.10':
                currentWorld = randomWorld(SIZE_X, SIZE_Y,0.1);
                break;
            case 'random 0.25':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.25);
                break;
            case 'random 0.50':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.5);
                break;
            case 'random 0.75':
                currentWorld = randomWorld(SIZE_X, SIZE_Y,0.75);
                break;
            default:
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.1);
        }
    }

    /**
     * セルの状態を取得する
     * @param {World} world - セルのマトリクス
     * @param {Location} p - 中心のセルの座標
     * @return {CellStateType} - セルの状態
     */
    function getState(world: World, p: Location): CellStateType {
        return world?.[p.x]?.[p.y];
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
                if (getState(world, {x: p.x + i, y: p.y + j})) {
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

    /**
     * 世界を時間発展させる
     * @param {World} world - 元になる世界
     * @return {World} - 新しい世界
     */
    function computeNextGeneration(world: World) {
        return world.map((row: Array<CellStateType>, i: number) => {
            return row.map((cell: CellStateType, j: number) => {
                return computeNextState(world, {x: i, y: j})
            })
        })
    }

    /**
     * ランダムに世界を生成する
     * @param {number} sizeX
     * @param {number} sizeY
     * @param {number} rate - 生きたセルの割合
     * @return {World} - 生成した世界
     */
    function randomWorld(sizeX: number, sizeY: number, rate: number) {
        const world = [];
        for (let i = 0; i < sizeX; ++i) {
            const row = [];
            for (let j = 0; j < sizeY; ++j) {
                row.push(Math.random() < rate);
            }
            world.push(row);
        }
        return world;
    }

    /**
     * 二つの世界が等しいか
     * @param {World} w1
     * @param {World} w2
     * @return {boolean} 等しい
     */
    function equals(w1: World, w2: World): boolean {
        return w1.every((row: Array<boolean>, i: number) => {
            return row.every((cell: boolean, j: number) => cell === w2[i][j])
        });
    }

    /**
     * console.log に世界のパターンを表示
     * 簡単なデバッグ用
     * @param {World} world
     */
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
