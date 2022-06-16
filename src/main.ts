import P5 from "p5";

const sketch = (p5: P5) => {
    p5.setup = () => {
        p5.createCanvas(300, 300);
        p5.background(51);
    };
};

/* eslint-disable no-new */
new P5(sketch);
