import * as React from 'react';
import data from './keyboard.svg';

const v = fetch(data).then((r) => r.text());

const usePromise = <T,>(v: Promise<T>) => {
    const [res, setRes] = React.useState(null as null | T);
    React.useEffect(() => {
        v.then(setRes);
    }, []);
    return res;
};

type Box = { width: number; height: number; x: number; y: number };
const collides = (box: Box, x: number, y: number) => {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
};

const boundingBox = (boxes: Box[]): Box => {
    const xMin = Math.min(...boxes.map((box) => box.x));
    const yMin = Math.min(...boxes.map((box) => box.y));
    const xMax = Math.max(...boxes.map((box) => box.x + box.width));
    const yMax = Math.max(...boxes.map((box) => box.y + box.height));
    return {
        x: xMin,
        y: yMin,
        width: xMax - xMin,
        height: yMax - yMin,
    };
};

const center = (box: Box) => {
    return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
    };
};

export const App = () => {
    const data = usePromise(v);
    const results = React.useMemo(() => {
        if (!data) return;
        const div = document.createElement('div');
        div.innerHTML = data;
        const rects = [...div.querySelectorAll('rect')].map((node) => {
            return {
                width: +node.getAttribute('width')!,
                height: +node.getAttribute('height')!,
                x: +node.getAttribute('x')!,
                y: +node.getAttribute('y')!,
                letter: '',
            };
        });
        [...div.querySelectorAll('text')].map((node) => {
            const x = +node.getAttribute('x')!;
            const y = +node.getAttribute('y')!;
            rects.forEach((rect) => {
                if (collides(rect, x, y)) {
                    rect.letter = node.textContent!;
                }
            });
            // return { letter: node.textContent, x: , y:  };
        });
        const bounds = boundingBox(rects);
        const width = 300;
        const scale = width / bounds.width;
        rects.forEach((rect) => {
            rect.x -= bounds.x;
            rect.y -= bounds.y;
            rect.x *= scale;
            rect.y *= scale;
            rect.width *= scale;
            rect.height *= scale;
        });
        console.log(rects);
        return rects;
    }, [data]);
    if (!results) return;
    console.log(results);
    return (
        <div>
            <Words results={results} words="Hello my name is qwertyface" />
            <Words results={results} words="I am a typeface that will test your knowledge of the keyboard" />
            <Words results={results} words="The main question is how possible is it to determine the correct sequence from just circles and lines" />
        </div>
    );
};

const Words = ({ words, results }: { results: Results; words: string }) => {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {words.split(' ').map((word, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
                    <Word results={results} word={word} key={i} />
                    {/* <span>{word}</span> */}
                </div>
            ))}
        </div>
    );
};

const angleTo = (from: Coord, to: Coord) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
};

type Coord = {
    x: number;
    y: number;
};

const push = (pos: Coord, theta: number, amt: number) => ({ x: pos.x + Math.cos(theta) * amt, y: pos.y + Math.sin(theta) * amt });

const minDist = 31;

type Results = (Box & { letter: string })[];

const Word = ({ word, results }: { word: string; results: Results }) => {
    const lines: JSX.Element[] = [];
    const overs: JSX.Element[] = [];
    const positions = word.split('').map((w) => results.find((r) => r.letter === w.toUpperCase())!);
    for (let i = 1; i < positions.length; i++) {
        if (!positions[i] || !positions[i - 1]) {
            console.log(word.split(''), positions);
            continue;
        }
        const p1 = center(positions[i - 1]);
        const p2 = center(positions[i]);
        if (positions[i - 1] === positions[i]) {
            lines.push(<circle key={lines.length} cx={p1.x} cy={p1.y} r={9} stroke="black" fill="none" />);
            continue;
        }
        drawLine(p1, p2, lines, overs);
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={300} height={100}>
            {/* {<path d={barc(center(results.find((r) => r.letter === 'J')!), Math.PI / 4, (Math.PI * 3) / 4, 14)} stroke="black" fill="none" />}
            {<path d={barc(center(results.find((r) => r.letter === 'F')!), Math.PI / 4, (Math.PI * 3) / 4, 14)} stroke="black" fill="none" />} */}
            {<path d={barc(center(results.find((r) => r.letter === 'J')!), Math.PI * 0.4, Math.PI * 0.6, 14)} stroke="black" fill="none" />}
            {<path d={barc(center(results.find((r) => r.letter === 'F')!), Math.PI * 0.4, Math.PI * 0.6, 14)} stroke="black" fill="none" />}
            {results.map((rect, i) => (
                // <path
                //     d={barc(center(rect), Math.PI / 4, (Math.PI * 3) / 4, 14)}
                //     stroke={rect.letter === 'J' || rect.letter === 'F' ? 'green' : '#aaa'}
                //     fill="none"
                //     strokeWidth={rect.letter === 'J' || rect.letter === 'F' ? 2 : 1}
                // />
                <Circle key={i} pos={center(rect)} r={3} fill={'#aaa'} opacity={0.5} />
            ))}
            {positions.map(
                (box, i) => (
                    // i === 0 ? (
                    //     <rect key={box.letter} fill={'black'} {...square(center(box), 7)} />
                    // ) : (
                    <Circle key={i} pos={center(box)} r={7} fill="black" />
                ),
                // ),
            )}
            {lines}
            <Circle pos={center(positions[0])} r={5} fill="white" />
            <Circle pos={center(positions[positions.length - 1])} r={3} fill="white" />
            {overs}
        </svg>
    );
};

const square = (pos: Coord, r: number) => {
    return { width: r * 2, height: r * 2, x: pos.x - r, y: pos.y - r };
};

const barc = (pos: Coord, t1: number, t2: number, r: number) => {
    const p1 = push(pos, t1, r);
    const p2 = push(pos, t2, r);
    return `M${p1.x},${p1.y}L${p2.x},${p2.y}`;
    // return `M${p1.x},${p1.y}A${r},${r} 0 0 1 ${p2.x},${p2.y}`;
};

const Circle = ({ pos, ...props }: React.ComponentProps<'circle'> & { pos: Coord }) => {
    return <circle cx={pos.x} cy={pos.y} {...props} />;
};

const drawLine: (p1: Coord, p2: Coord, lines: JSX.Element[], overs: JSX.Element[]) => void = v3line;

function v3line(p1: Coord, p2: Coord, lines: JSX.Element[], overs: JSX.Element[]) {
    const t = angleTo(p1, p2);
    const left = push(p2, t + (2 * Math.PI) / 3, 7);
    const right = push(p2, t - (2 * Math.PI) / 3, 7);

    const mid = push(p2, t + Math.PI, minDist);

    const l1 = push(mid, t + Math.PI / 2, 0.5);
    const l2 = push(mid, t - Math.PI / 2, 0.5);
    const off = push(p2, t + Math.PI, 14);
    lines.push(
        <path
            key={lines.length}
            fill="black"
            d={`M${left.x},${left.y}Q${off.x},${off.y} ${l1.x},${l1.y}L${l2.x},${l2.y}Q${off.x},${off.y} ${right.x},${right.y}`}
        />,
        <line x1={p1.x} y1={p1.y} x2={mid.x} y2={mid.y} stroke="black" strokeWidth={1} />,
    );
    // overs.push(<Circle pos={push(p1, t, 7)} key={overs.length} fill="white" stroke="black" r={3} />);
}

function v2line(p1: Coord, p2: Coord, lines: JSX.Element[]) {
    const t = angleTo(p1, p2);
    const left = push(p2, t + (2 * Math.PI) / 3, 7);
    const right = push(p2, t - (2 * Math.PI) / 3, 7);

    const mid = push(p2, t + Math.PI, minDist / 2);

    const l1 = push(mid, t + Math.PI / 2, 0.5);
    const l2 = push(mid, t - Math.PI / 2, 0.5);
    const off = push(p2, t + Math.PI, 14);
    lines.push(
        <path
            key={lines.length}
            fill="black"
            d={`M${left.x},${left.y}Q${off.x},${off.y} ${l1.x},${l1.y}L${l2.x},${l2.y}Q${off.x},${off.y} ${right.x},${right.y}`}
        />,
        <line x1={p1.x} y1={p1.y} x2={mid.x} y2={mid.y} stroke="black" strokeWidth={1} />,
    );
}

function v1line(p1: { x: number; y: number }, p2: { x: number; y: number }, lines: JSX.Element[]) {
    const t = angleTo(p1, p2);
    const left = push(p2, t + (2 * Math.PI) / 3, 7);
    const right = push(p2, t - (2 * Math.PI) / 3, 7);
    const l1 = push(p1, t + Math.PI / 2, 0.5);
    const l2 = push(p1, t - Math.PI / 2, 0.5);
    const off = push(p2, t + Math.PI, 14);
    lines.push(
        <path
            key={lines.length}
            fill="black"
            d={`M${left.x},${left.y}Q${off.x},${off.y} ${l1.x},${l1.y}L${l2.x},${l2.y}Q${off.x},${off.y} ${right.x},${right.y}`}
        />,
    );
}
