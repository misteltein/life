import P5 from "p5";

import {gosper, flyingMachine} from "./asset";

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

let SIZE_X = 150;
let SIZE_Y = 100;

let PBC = true;
let EditorMode = false;

const sketch = (p5: P5) => {
    let currentWorld: World;
    let selectedMode: P5.Element;
    let checkboxPBC: P5.Element;
    let checkboxEditor: P5.Element;
    let radioWorldSize: P5.Element;
    let radioSpeed: P5.Element;

    p5.setup = () => {
        p5.createCanvas(900, 600);
        p5.background(51);
        p5.frameRate(10);
        currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.1);

        // 初期構造のメニュー
        selectedMode = p5.createSelect();
        selectedMode.option('random 0.10');
        selectedMode.option('random 0.25');
        selectedMode.option('random 0.50');
        selectedMode.option('random 0.75');
        selectedMode.option('Gosper\'s glider gun');
        selectedMode.option('flying machine');
        selectedMode.changed(handleChangeMode);

        // マップのサイズ選択
        radioWorldSize = p5.createRadio();
        radioWorldSize.option('30 x 20');
        radioWorldSize.option('60 x 40');
        radioWorldSize.option('150 x 100');
        radioWorldSize.option('300 x 200');
        radioWorldSize.attribute('name', 'size');
        radioWorldSize.selected('150 x 100')
        radioWorldSize.changed(handleChangeWorldSize);

        // フレームレート選択
        radioSpeed = p5.createRadio();
        radioSpeed.option('1 fps');
        radioSpeed.option('10 fps');
        radioSpeed.option('20 fps');
        radioSpeed.attribute('name', 'speed')
        radioSpeed.selected('10 fps');
        radioSpeed.changed(handleChangeFrameRate);

        // エディターモードの切り替え
        checkboxEditor = p5.createCheckbox('Create', false);
        checkboxEditor.changed(() => {
            EditorMode = checkboxEditor.checked()
            if (EditorMode) {
                currentWorld = blankWorld(SIZE_X, SIZE_Y);
                p5.frameRate(30);
            } else {
                // ここで出力処理
                output(currentWorld);
                p5.frameRate(10);
            }
        })

        // 周期境界条件の切り替え
        checkboxPBC = p5.createCheckbox('PBC', true);
        checkboxPBC.changed(() => {
            PBC = checkboxPBC.checked()
        })
        currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.1);
    };

    p5.draw = () => {
        if (!EditorMode) {
            currentWorld = computeNextGeneration(currentWorld);
        }
        const dx = p5.width / SIZE_X;
        const dy = p5.height / SIZE_Y;
        if (EditorMode) {
            p5.stroke(255);
            p5.strokeWeight(0.1);
        } else {
            p5.noStroke();
        }

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

    p5.mouseClicked = () => {
        if (EditorMode) {
            if (
                p5.mouseX >= 0 && p5.mouseX <= p5.width &&
                p5.mouseY >= 0 && p5.mouseY <= p5.height
            ) {
                const dx = p5.width / SIZE_X;
                const dy = p5.height / SIZE_Y;
                const ix = Math.floor(p5.mouseX / dx);
                const iy = Math.floor(p5.mouseY / dy);
                currentWorld[ix][iy] = !currentWorld[ix][iy];
            }
        }
    }

    /**
     * 初期状態の選択
     */
    function handleChangeMode() {
        const item = selectedMode.value();
        if (item === 'random 0.2') {
            currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.2);
        }
        switch (selectedMode.value()) {
            case 'random 0.10':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.1);
                break;
            case 'random 0.25':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.25);
                break;
            case 'random 0.50':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.5);
                break;
            case 'random 0.75':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.75);
                break;
            case 'Gosper\'s glider gun':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.0);
                set(gosper);
                break;
            case 'flying machine':
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.0);
                set(flyingMachine);
                break;
            default:
                currentWorld = randomWorld(SIZE_X, SIZE_Y, 0.1);
        }
    }

    /**
     * マップのサイズをラジオに基づいて変更
     */
    function handleChangeWorldSize() {
        const size = radioWorldSize.value().split(' x ')
            .map((str: string) => Number(str));
        const newWorld = blankWorld(size[0], size[1]);
        for (let i = 0; i < size[0]; ++i) {
            for (let j = 0; j < size[1]; ++j) {
                newWorld[i][j] = getState(currentWorld, {x: i, y: j});
            }
        }
        SIZE_X = size[0] as number;
        SIZE_Y = size[1] as number;
        currentWorld = newWorld;
    }

    /**
     * フレームレートをラジオに基づいて変更
     */
    function handleChangeFrameRate() {
        const fps = Number(radioSpeed.value().split(' fps')[0]);
        p5.frameRate(fps)
        console.log(fps)
    }

    /**
     * セルの状態を取得する
     * @param {World} world - セルのマトリクス
     * @param {Location} p - 中心のセルの座標
     * @return {CellStateType} - セルの状態
     */
    function getState(world: World, p: Location): CellStateType {
        if (PBC) {
            const x = p.x < 0 ? p.x + SIZE_X : SIZE_X <= p.x ? p.x - SIZE_X : p.x
            const y = p.y < 0 ? p.y + SIZE_Y : SIZE_Y <= p.y ? p.y - SIZE_Y : p.y
            return world[x][y];
        } else {
            return world[p.x]?.[p.y];
        }
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
     * 死の世界を生成する
     * @param {number} sizeX
     * @param {number} sizeY
     */
    function blankWorld(sizeX: number, sizeY: number) {
        const world = [];
        for (let i = 0; i < sizeX; ++i) {
            const row = [];
            for (let j = 0; j < sizeY; ++j) {
                row.push(CellState.dead);
            }
            world.push(row);
        }
        return world;
    }

    /**
     * 作成したマップを console.log に保存
     * @param {World} world
     */
    function output(world: World) {
        let str = '';
        world.forEach((row) => {
            row.forEach(cell => {
                str += cell ? '1,' : '0,'
            })
            str += '\n';
        })
        console.log(str);
    }

    /**
     * 文字列で保存しているマップデータを現在の世界に乗せる
     * @param {string} pattern
     */
    function set(pattern: string) {
        const rows = pattern.split('\n');
        rows.forEach((row, i) => {
            const cells = row.split(',');
            cells.forEach((cell, j) => {
                currentWorld[i][j] = cell === '1';
            })
        })
    }
};

/* eslint-disable no-new */
new P5(sketch);
